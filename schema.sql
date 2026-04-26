-- schema.sql
-- All-in-One SaaS F&B Management System Schema (Multi-Tenant)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. CLEAN WIPE (Reset for Multi-Tenancy)
-- ==========================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ==========================================
-- 1. COMPANIES (The Core of Multi-Tenancy)
-- ==========================================
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. PROFILES (HR / Users tied to a Company)
-- ==========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. CUSTOMERS (CRM)
-- ==========================================
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(company_id, phone),
  UNIQUE(company_id, email)
);

-- ==========================================
-- 4. CATEGORIES (POS)
-- ==========================================
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. PRODUCTS (POS)
-- ==========================================
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. INVENTORY ITEMS
-- ==========================================
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- e.g., 'g', 'ml', 'pcs'
  quantity NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. RECIPES (Linking Products to Inventory)
-- ==========================================
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL CHECK (quantity_required > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, inventory_item_id)
);

-- ==========================================
-- 8. ORDERS (POS)
-- ==========================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 9. ORDER ITEMS (POS)
-- ==========================================
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- TASK 2: INVENTORY DEDUCTION LOGIC
-- ==========================================

-- Function to deduct inventory based on recipes when an order is completed
CREATE OR REPLACE FUNCTION process_completed_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  order_item RECORD;
  recipe_item RECORD;
BEGIN
  -- Loop through all items in the completed order
  FOR order_item IN 
    SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id
  LOOP
    -- For each product, find its recipe and deduct the required inventory
    FOR recipe_item IN 
      SELECT inventory_item_id, quantity_required 
      FROM recipes 
      WHERE product_id = order_item.product_id
    LOOP
      -- Update the inventory item quantity (company_id automatically restricts scope indirectly via the ID, but we can be explicit)
      UPDATE inventory_items
      SET quantity = quantity - (recipe_item.quantity_required * order_item.quantity)
      WHERE id = recipe_item.inventory_item_id AND company_id = NEW.company_id;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to fire the function when order status becomes 'completed'
CREATE TRIGGER trigger_deduct_inventory_on_complete
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION process_completed_order_inventory();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) FOR MULTI-TENANCY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get the company_id of the currently logged-in user
-- SECURITY DEFINER allows this function to bypass RLS to check the profiles table, preventing infinite recursion
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- 1. Companies Policies
-- Allow anyone to create a company during signup
CREATE POLICY "Allow authenticated to insert company" ON companies FOR INSERT TO authenticated WITH CHECK (true);
-- Users can only view/update their own company
CREATE POLICY "Users can view their own company" ON companies FOR SELECT USING (id = get_auth_company_id());
CREATE POLICY "Users can update their own company" ON companies FOR UPDATE USING (id = get_auth_company_id());

-- 2. Profiles Policies
-- Allow a user to insert their own profile during signup
CREATE POLICY "Allow users to insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
-- Users can see all profiles that belong to their company
CREATE POLICY "Users can view company profiles" ON profiles FOR SELECT USING (company_id = get_auth_company_id());
-- Admins/Users can update profiles within their company
CREATE POLICY "Users can update company profiles" ON profiles FOR UPDATE USING (company_id = get_auth_company_id());

-- 3. Universal SaaS Isolation Policies for all operational tables
-- This guarantees that a user can ONLY read, insert, update, or delete records that match their company_id
CREATE POLICY "Company isolation" ON customers FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON categories FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON products FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON inventory_items FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON recipes FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON orders FOR ALL USING (company_id = get_auth_company_id());
CREATE POLICY "Company isolation" ON order_items FOR ALL USING (company_id = get_auth_company_id());
