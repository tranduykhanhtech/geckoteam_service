import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useShiftStore } from './shiftStore';

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
  is_available?: boolean;
}

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for cart entry
  quantity: number;
}

export interface POSState {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;

  // Loyalty
  selectedCustomer: any | null;
  pointsToRedeem: number;
  loyaltyConfig: { points_rate: number; redemption_value: number } | null;

  // Actions
  fetchProductsAndCategories: (includeUnavailable?: boolean) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product> & { is_available?: boolean }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setSelectedCategory: (category: string) => void;
  setSelectedCustomer: (customer: any | null) => void;
  setPointsToRedeem: (points: number) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  checkout: () => Promise<string>;
  voidOrder: (orderId: string) => Promise<void>;

  // Computed
  getSubtotal: () => number;
  getLoyaltyDiscount: () => number;
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  products: [],
  categories: [],
  cart: [],
  selectedCategory: 'All',
  selectedCustomer: null,
  pointsToRedeem: 0,
  loyaltyConfig: null,
  isLoading: false,
  error: null,

  fetchProductsAndCategories: async (includeUnavailable = false) => {
    set({ isLoading: true, error: null });
    try {
      const profile = useAuthStore.getState().profile;
      if (!profile?.company_id) return;

      // Fetch company loyalty config
      const { data: company } = await supabase
        .from('companies')
        .select('points_rate, point_redemption_value')
        .eq('id', profile.company_id)
        .single();
      
      if (company) {
        set({ loyaltyConfig: { 
          points_rate: Number(company.points_rate), 
          redemption_value: Number(company.point_redemption_value) 
        }});
      }

      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      // Fetch products with category joined
      let query = supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');
      
      if (!includeUnavailable) {
        query = query.eq('is_available', true);
      }

      const { data: productsData, error: prodError } = await query;

      if (prodError) throw prodError;

      const formattedProducts = productsData.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category_id: p.category_id,
        category_name: p.categories?.name,
        image_url: p.image_url,
        is_available: p.is_available
      }));

      set({ categories: categories || [], products: formattedProducts });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProduct: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        products: state.products.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      }));
    } catch (err: any) {
      console.error('updateProduct error:', err.message);
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        products: state.products.filter(p => p.id !== id)
      }));
    } catch (err: any) {
      console.error('deleteProduct error:', err.message);
      throw err;
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer, pointsToRedeem: 0 }),
  setPointsToRedeem: (points) => set({ pointsToRedeem: points }),

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
    const { cart, getTotal, getSubtotal, getLoyaltyDiscount, selectedCustomer, pointsToRedeem, loyaltyConfig } = get();
    if (cart.length === 0) throw new Error("Cart is empty");

    set({ isLoading: true, error: null });
    try {
      const profile = useAuthStore.getState().profile;
      const { currentShift } = useShiftStore.getState();
      
      if (!profile) throw new Error("User not authenticated or missing profile");
      if (!currentShift) throw new Error("No active shift. Please open a shift first.");

      const generateOrderCode = () => {
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars
        return `GK-${datePart}-${randomPart}`;
      };

      const orderCode = generateOrderCode();
      const orderId = crypto.randomUUID();
      const totalAmount = getTotal();
      const subtotal = getSubtotal();
      const loyaltyDiscount = getLoyaltyDiscount();

      // 1. Create the order
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          order_code: orderCode,
          company_id: profile.company_id,
          staff_id: profile.id,
          customer_id: selectedCustomer?.id || null,
          subtotal: subtotal,
          loyalty_discount: loyaltyDiscount,
          total_amount: totalAmount,
          status: 'completed',
          shift_id: currentShift.id
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

      // --- LOYALTY UPDATES ---
      if (selectedCustomer && loyaltyConfig) {
        const pointsEarned = Math.floor(totalAmount / loyaltyConfig.points_rate);
        const newTotalPoints = (selectedCustomer.points || 0) - pointsToRedeem + pointsEarned;
        const newLifetimeSpend = (selectedCustomer.total_spent || 0) + totalAmount;

        const { error: crmError } = await supabase
          .from('customers')
          .update({ 
            points: newTotalPoints,
            total_spent: newLifetimeSpend
          })
          .eq('id', selectedCustomer.id);
        
        if (crmError) console.error('Failed to update customer loyalty:', crmError);
      }

      // --- INVENTORY DEDUCTION LOGIC ---
      try {
        const productIds = cart.map(item => item.id);
        const { data: recipes, error: recipeError } = await supabase
          .from('product_recipes')
          .select('product_id, inventory_item_id, quantity')
          .in('product_id', productIds);

        if (!recipeError && recipes && recipes.length > 0) {
          const invIds = [...new Set(recipes.map(r => r.inventory_item_id))];
          const { data: invItems } = await supabase
            .from('inventory_items')
            .select('id, weight_volume_value')
            .in('id', invIds);

          const deductions: Record<string, number> = {};
          cart.forEach(cartItem => {
            const itemRecipes = recipes.filter(r => r.product_id === cartItem.id);
            itemRecipes.forEach(r => {
              const totalDeductBase = Number(r.quantity) * cartItem.quantity;
              const itemInfo = invItems?.find(inv => inv.id === r.inventory_item_id);
              const factor = itemInfo?.weight_volume_value ? Number(itemInfo.weight_volume_value) : 1;
              const totalDeductUnits = totalDeductBase / factor;
              deductions[r.inventory_item_id] = (deductions[r.inventory_item_id] || 0) + totalDeductUnits;
            });
          });

          for (const [itemId, amount] of Object.entries(deductions)) {
            const { data: currentInv } = await supabase.from('inventory_items').select('quantity').eq('id', itemId).single();
            if (currentInv) {
              const newQty = Math.max(0, Number(currentInv.quantity) - amount);
              await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', itemId);
              await supabase.from('inventory_adjustments').insert([{
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
      }

      // 4. Clear state on success
      set({ cart: [], selectedCustomer: null, pointsToRedeem: 0 });
      return orderCode;

    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  getSubtotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getLoyaltyDiscount: () => {
    const { pointsToRedeem, loyaltyConfig } = get();
    if (!loyaltyConfig) return 0;
    return pointsToRedeem * loyaltyConfig.redemption_value;
  },

  getTotal: () => {
    return Math.max(0, get().getSubtotal() - get().getLoyaltyDiscount());
  },

  voidOrder: async (orderIdentifier: string) => {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderIdentifier);
      
      let query = supabase.from('orders').select('id, order_code');
      
      if (isUuid) {
        query = query.eq('id', orderIdentifier);
      } else {
        query = query.eq('order_code', orderIdentifier);
      }

      const { data: order, error: fetchError } = await query.single();

      if (fetchError || !order) throw new Error("Order not found. Check the code or ID.");

      // First delete order_items (though cascade should handle it, explicit is safer)
      const { error: itemsDeleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);

      if (itemsDeleteError) throw itemsDeleteError;

      // Then delete the order itself
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (orderDeleteError) throw orderDeleteError;

      console.log(`Order ${order.order_code} and its items have been permanently deleted.`);
    } catch (err: any) {
      console.error('Failed to permanently delete order:', err.message);
      throw err;
    }
  },
}));
