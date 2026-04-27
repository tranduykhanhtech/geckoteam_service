import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useInventoryStore } from './inventoryStore';

export interface TransferItem {
  name: string;
  unit: string;
  quantity: number;
  category_id: string;
}

export interface InventoryTransfer {
  id: string;
  from_store_id: string;
  to_store_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  items: TransferItem[];
  from_store_name?: string;
  to_store_name?: string;
  creator_name?: string;
}

interface TransferState {
  transfers: InventoryTransfer[];
  isLoading: boolean;
  error: string | null;

  fetchTransfers: () => Promise<void>;
  createTransfer: (toStoreId: string, items: TransferItem[]) => Promise<void>;
  acceptTransfer: (transferId: string) => Promise<void>;
  cancelTransfer: (transferId: string) => Promise<void>;
}

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  isLoading: false,
  error: null,

  fetchTransfers: async () => {
    set({ isLoading: true });
    try {
      const profile = useAuthStore.getState().profile;
      if (!profile?.store_id) {
        set({ transfers: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('inventory_transfers')
        .select(`
          *,
          from_store:stores!from_store_id(name),
          to_store:stores!to_store_id(name),
          creator:profiles!created_by(full_name),
          items:inventory_transfer_items(*)
        `)
        .or(`from_store_id.eq.${profile.store_id},to_store_id.eq.${profile.store_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((t: any) => ({
        id: t.id,
        from_store_id: t.from_store_id,
        to_store_id: t.to_store_id,
        status: t.status,
        created_by: t.created_by,
        created_at: t.created_at,
        items: t.items,
        from_store_name: t.from_store?.name,
        to_store_name: t.to_store?.name,
        creator_name: t.creator?.full_name
      }));

      set({ transfers: formatted });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createTransfer: async (toStoreId, items) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.store_id) throw new Error("Staff must be assigned to a store to create transfers");

    try {
      // 1. Create transfer record
      const { data: transfer, error: tError } = await supabase
        .from('inventory_transfers')
        .insert([{
          company_id: profile.company_id,
          from_store_id: profile.store_id,
          to_store_id: toStoreId,
          created_by: profile.id,
          status: 'pending'
        }])
        .select()
        .single();

      if (tError) throw tError;

      // 2. Create transfer items
      const transferItems = items.map(it => ({
        transfer_id: transfer.id,
        name: it.name,
        unit: it.unit,
        quantity: it.quantity,
        category_id: it.category_id
      }));

      const { error: iError } = await supabase
        .from('inventory_transfer_items')
        .insert(transferItems);

      if (iError) throw iError;

      get().fetchTransfers();
    } catch (err: any) {
      console.error('createTransfer error:', err.message);
      throw err;
    }
  },

  acceptTransfer: async (transferId) => {
    const profile = useAuthStore.getState().profile;
    const transfer = get().transfers.find(t => t.id === transferId);
    if (!transfer || !profile) return;

    set({ isLoading: true });
    try {
      // 1. Update status
      const { error: sError } = await supabase
        .from('inventory_transfers')
        .update({ status: 'completed' })
        .eq('id', transferId);
      
      if (sError) throw sError;

      // 2. Inventory adjustments
      for (const item of transfer.items) {
        // Find item in source store
        const { data: sourceItem } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('store_id', transfer.from_store_id)
          .eq('name', item.name)
          .single();
        
        if (sourceItem) {
          // Subtract from source
          await supabase
            .from('inventory_items')
            .update({ quantity: Math.max(0, Number(sourceItem.quantity) - item.quantity) })
            .eq('id', sourceItem.id);
        }

        // Find or create item in destination store
        const { data: destItem } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('store_id', transfer.to_store_id)
          .eq('name', item.name)
          .single();
        
        if (destItem) {
          // Add to destination
          await supabase
            .from('inventory_items')
            .update({ quantity: Number(destItem.quantity) + item.quantity })
            .eq('id', destItem.id);
        } else {
          // Create new item in destination
          await supabase
            .from('inventory_items')
            .insert([{
              company_id: profile.company_id,
              store_id: transfer.to_store_id,
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              category_id: item.category_id,
              low_stock_threshold: 10 // default
            }]);
        }
      }

      get().fetchTransfers();
      useInventoryStore.getState().fetchItems();
    } catch (err: any) {
      console.error('acceptTransfer error:', err.message);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelTransfer: async (transferId) => {
    try {
      const { error } = await supabase
        .from('inventory_transfers')
        .update({ status: 'cancelled' })
        .eq('id', transferId);
      if (error) throw error;
      get().fetchTransfers();
    } catch (err: any) {
      console.error('cancelTransfer error:', err.message);
      throw err;
    }
  }
}));
