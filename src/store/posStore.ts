import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for cart entry
  quantity: number;
}

interface POSState {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProductsAndCategories: () => Promise<void>;
  setSelectedCategory: (category: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  checkout: () => Promise<void>;
  voidOrder: (orderId: string) => Promise<void>;

  // Computed
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  products: [],
  categories: [],
  cart: [],
  selectedCategory: 'All',
  isLoading: false,
  error: null,

  fetchProductsAndCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      // Fetch products with category joined
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_available', true)
        .order('name');

      if (prodError) throw prodError;

      const formattedProducts = productsData.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category_id: p.category_id,
        category_name: p.categories?.name,
        image_url: p.image_url
      }));

      set({ categories: categories || [], products: formattedProducts });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find((item) => item.id === product.id);
    if (existingItem) {
      return {
        cart: state.cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      };
    }
    return {
      cart: [...state.cart, { ...product, cartItemId: crypto.randomUUID(), quantity: 1 }],
    };
  }),

  removeFromCart: (cartItemId) => set((state) => ({
    cart: state.cart.filter((item) => item.cartItemId !== cartItemId),
  })),

  updateQuantity: (cartItemId, delta) => set((state) => ({
    cart: state.cart.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }),
  })),

  clearCart: () => set({ cart: [] }),

  checkout: async () => {
    const { cart, getTotal } = get();
    if (cart.length === 0) return;

    set({ isLoading: true, error: null });
    try {
      const profile = useAuthStore.getState().profile;
      if (!profile) throw new Error("User not authenticated or missing profile");

      const orderId = crypto.randomUUID();
      const totalAmount = getTotal();

      // 1. Create the order
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          company_id: profile.company_id,
          staff_id: profile.id,
          total_amount: totalAmount,
          status: 'completed'
        }]);

      if (orderError) throw orderError;

      // 2. Create the order items
      const orderItems = cart.map(item => ({
        company_id: profile.company_id,
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // --- INVENTORY DEDUCTION LOGIC ---
      try {
        const productIds = cart.map(item => item.id);
        
        // 1. Fetch recipes for all products in cart
        const { data: recipes, error: recipeError } = await supabase
          .from('product_recipes')
          .select('product_id, inventory_item_id, quantity')
          .in('product_id', productIds);

        if (recipeError) throw recipeError;

        if (recipes && recipes.length > 0) {
          // Fetch conversion factors for these items
          const invIds = [...new Set(recipes.map(r => r.inventory_item_id))];
          const { data: invItems } = await supabase
            .from('inventory_items')
            .select('id, weight_volume_value')
            .in('id', invIds);

          // 2. Calculate total deduction for each inventory item
          const deductions: Record<string, number> = {};
          
          cart.forEach(cartItem => {
            const itemRecipes = recipes.filter(r => r.product_id === cartItem.id);
            itemRecipes.forEach(r => {
              const totalDeductBase = Number(r.quantity) * cartItem.quantity;
              
              // Get item conversion info from DB response
              const itemInfo = invItems?.find(inv => inv.id === r.inventory_item_id);
              const factor = itemInfo?.weight_volume_value ? Number(itemInfo.weight_volume_value) : 1;
              
              // totalDeduct is in 'Purchase Units' (e.g. 20g / 1000g = 0.02 Box)
              const totalDeductUnits = totalDeductBase / factor;
              deductions[r.inventory_item_id] = (deductions[r.inventory_item_id] || 0) + totalDeductUnits;
            });
          });

          // 3. Apply deductions one by one
          for (const [itemId, amount] of Object.entries(deductions)) {
            const { data: currentInv } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('id', itemId)
              .single();

            if (currentInv) {
              const newQty = Math.max(0, Number(currentInv.quantity) - amount);
              await supabase
                .from('inventory_items')
                .update({ quantity: newQty })
                .eq('id', itemId);

              // Log the adjustment
              await supabase
                .from('inventory_adjustments')
                .insert([{
                  company_id: profile.company_id,
                  item_id: itemId,
                  staff_id: profile.id,
                  amount: -amount,
                  type: 'POS Auto-Deduct',
                  note: `Order #${orderId.slice(0,8)}`
                }]);
            }
          }
        }
      } catch (invErr) {
        console.error('Inventory deduction failed:', invErr);
        // We don't throw here to avoid failing the order if inventory fails
      }

      // 4. Clear cart on success
      set({ cart: [] });

    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  getTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  voidOrder: async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to void order:', err.message);
      throw err;
    }
  },
}));
