import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useStoreStore } from './storeStore';
import { useInventoryStore } from './inventoryStore';

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  inventory_item_name?: string;
  inventory_item_unit?: string;
}

export interface PurchaseOrder {
  id: string;
  store_id: string;
  supplier_id: string;
  supplier_name?: string;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  total_amount: number;
  expected_date: string | null;
  received_at: string | null;
  created_at: string;
  items: PurchaseOrderItem[];
}

interface ProcurementState {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  error: string | null;

  fetchSuppliers: () => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  
  fetchPurchaseOrders: () => Promise<void>;
  createPurchaseOrder: (supplierId: string, items: Omit<PurchaseOrderItem, 'id' | 'po_id' | 'subtotal'>[], expectedDate: string | null) => Promise<void>;
  receivePurchaseOrder: (poId: string) => Promise<void>;
}

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  suppliers: [],
  purchaseOrders: [],
  isLoading: false,
  error: null,

  fetchSuppliers: async () => {
    const { profile } = useAuthStore.getState();
    if (!profile?.company_id) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      set({ suppliers: data as Supplier[] });
    } catch (err: any) {
      console.error('fetchSuppliers error:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createSupplier: async (supplierData) => {
    const { profile } = useAuthStore.getState();
    if (!profile?.company_id) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          company_id: profile.company_id,
          ...supplierData
        }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ suppliers: [...state.suppliers, data as Supplier] }));
    } catch (err: any) {
      console.error('createSupplier error:', err);
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPurchaseOrders: async () => {
    const { profile } = useAuthStore.getState();
    const { currentStoreId } = useStoreStore.getState();
    const targetStoreId = currentStoreId || profile?.store_id;

    if (!targetStoreId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name),
          purchase_order_items (
            *,
            inventory_items (name, unit)
          )
        `)
        .eq('store_id', targetStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPOs: PurchaseOrder[] = data.map((po: any) => ({
        ...po,
        supplier_name: po.suppliers?.name,
        items: po.purchase_order_items.map((item: any) => ({
          ...item,
          inventory_item_name: item.inventory_items?.name,
          inventory_item_unit: item.inventory_items?.unit,
        }))
      }));

      set({ purchaseOrders: formattedPOs });
    } catch (err: any) {
      console.error('fetchPurchaseOrders error:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createPurchaseOrder: async (supplierId, items, expectedDate) => {
    const { profile } = useAuthStore.getState();
    const { currentStoreId } = useStoreStore.getState();
    const targetStoreId = currentStoreId || profile?.store_id;

    if (!profile?.company_id || !targetStoreId) throw new Error("Store or Company not found");

    set({ isLoading: true, error: null });
    try {
      // 1. Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // 2. Create PO
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          company_id: profile.company_id,
          store_id: targetStoreId,
          supplier_id: supplierId,
          created_by: profile.id,
          status: 'pending',
          total_amount: totalAmount,
          expected_date: expectedDate || null
        }])
        .select()
        .single();

      if (poError) throw poError;

      // 3. Create PO Items
      const poItems = items.map(item => ({
        po_id: poData.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      await get().fetchPurchaseOrders();
    } catch (err: any) {
      console.error('createPurchaseOrder error:', err);
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  receivePurchaseOrder: async (poId) => {
    const { profile } = useAuthStore.getState();
    const po = get().purchaseOrders.find(p => p.id === poId);

    if (!po || !profile?.company_id) throw new Error("PO not found or invalid profile");
    if (po.status === 'received') throw new Error("PO is already received");

    set({ isLoading: true, error: null });
    try {
      // 1. Update PO Status
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({ 
          status: 'received',
          received_at: new Date().toISOString()
        })
        .eq('id', poId);

      if (poError) throw poError;

      // 2. Update Inventory Stock and create Adjustments
      for (const item of po.items) {
        // Get current quantity
        const { data: currentInv } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.inventory_item_id)
          .single();

        if (currentInv) {
          const newQty = Number(currentInv.quantity) + item.quantity;
          
          // Update item
          await supabase
            .from('inventory_items')
            .update({ quantity: newQty })
            .eq('id', item.inventory_item_id);

          // Log adjustment
          await supabase
            .from('inventory_adjustments')
            .insert([{
              company_id: profile.company_id,
              item_id: item.inventory_item_id,
              staff_id: profile.id,
              amount: item.quantity,
              type: 'Restock',
              note: `Received PO #${poId.slice(0,8)}`
            }]);
        }
      }

      // Refresh data
      await get().fetchPurchaseOrders();
      await useInventoryStore.getState().fetchItems();
      await useInventoryStore.getState().fetchHistory();

    } catch (err: any) {
      console.error('receivePurchaseOrder error:', err);
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  }
}));
