import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  weight_volume_value: number;
  weight_volume_unit: string;
  quantity: number;
  threshold: number;
  category_id: string;
  category_name: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface AdjustmentRecord {
  id: string;
  item_id: string;
  item_name: string;
  amount: number;
  type: 'Restock' | 'Spoilage' | 'POS Auto-Deduct';
  note: string | null;
  created_at: string;
  staff_name?: string;
}

interface InventoryState {
  items: InventoryItem[];
  categories: InventoryCategory[];
  adjustmentHistory: AdjustmentRecord[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  adjustStock: (id: string, amount: number, type?: AdjustmentRecord['type'], note?: string) => Promise<void>;
  updateThreshold: (id: string, threshold: number) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'category_name'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'category_name'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  categories: [],
  adjustmentHistory: [],
  isLoading: false,
  isHistoryLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id, 
          name, 
          unit,
          weight_volume_value,
          weight_volume_unit,
          quantity, 
          low_stock_threshold, 
          category_id,
          inventory_categories (
            name
          )
        `)
        .eq('company_id', useAuthStore.getState().profile?.company_id)
        .order('name');

      if (error) throw error;

      const items: InventoryItem[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        unit: row.unit,
        weight_volume_value: Number(row.weight_volume_value || 1),
        weight_volume_unit: row.weight_volume_unit || row.unit,
        quantity: Number(row.quantity),
        threshold: Number(row.low_stock_threshold),
        category_id: row.category_id,
        category_name: (row as any).inventory_categories?.name || 'Uncategorized',
      }));

      set({ items });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('id, name')
        .eq('company_id', useAuthStore.getState().profile?.company_id)
        .order('name');
      
      if (error) throw error;
      set({ categories: data || [] });
    } catch (err: any) {
      console.error('fetchCategories error:', err.message);
    }
  },

  fetchHistory: async () => {
    set({ isHistoryLoading: true });
    try {
      const { data, error } = await supabase
        .from('inventory_adjustments')
        .select('id, item_id, amount, type, note, created_at, inventory_items(name), profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const history: AdjustmentRecord[] = (data || []).map((row: any) => ({
        id: row.id,
        item_id: row.item_id,
        item_name: row.inventory_items?.name ?? 'Unknown',
        amount: Number(row.amount),
        type: row.type as AdjustmentRecord['type'],
        note: row.note ?? null,
        created_at: row.created_at,
        staff_name: row.profiles?.full_name ?? null,
      }));

      set({ adjustmentHistory: history });
    } catch (err: any) {
      console.error('Failed to fetch history:', err.message);
    } finally {
      set({ isHistoryLoading: false });
    }
  },

  adjustStock: async (id, amount, type = amount >= 0 ? 'Restock' : 'Spoilage', note) => {
    const profile = useAuthStore.getState().profile;
    try {
      const item = get().items.find(i => i.id === id);
      if (!item) throw new Error('Item not found');

      const newQty = Math.max(0, item.quantity + amount);

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQty })
        .eq('id', id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('inventory_adjustments')
        .insert([{
          company_id: profile?.company_id,
          item_id: id,
          amount,
          type,
          note: note ?? null,
          staff_id: profile?.id ?? null,
        }]);

      if (logError) throw logError;

      set(state => ({
        items: state.items.map(i =>
          i.id === id ? { ...i, quantity: newQty } : i
        ),
      }));

      if (get().adjustmentHistory.length > 0) {
        get().fetchHistory();
      }
    } catch (err: any) {
      console.error('adjustStock error:', err.message);
      throw err;
    }
  },

  updateThreshold: async (id, threshold) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ low_stock_threshold: Math.max(0, threshold) })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, threshold: Math.max(0, threshold) } : item
        ),
      }));
    } catch (err: any) {
      console.error('updateThreshold error:', err.message);
      throw err;
    }
  },

  addItem: async (newItem) => {
    const profile = useAuthStore.getState().profile;
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          name: newItem.name,
          unit: newItem.unit,
          weight_volume_value: newItem.weight_volume_value,
          weight_volume_unit: newItem.weight_volume_unit,
          quantity: newItem.quantity,
          low_stock_threshold: newItem.threshold,
          category_id: newItem.category_id,
          company_id: profile?.company_id,
        }])
        .select(`
          id, 
          name, 
          unit,
          weight_volume_value,
          weight_volume_unit,
          quantity, 
          low_stock_threshold, 
          category_id,
          inventory_categories (
            name
          )
        `)
        .single();

      if (error) throw error;
 
      const item: InventoryItem = {
        id: data.id,
        name: data.name,
        unit: data.unit,
        weight_volume_value: Number(data.weight_volume_value),
        weight_volume_unit: data.weight_volume_unit,
        quantity: Number(data.quantity),
        threshold: Number(data.low_stock_threshold),
        category_id: data.category_id,
        category_name: (data as any).inventory_categories?.name || 'Uncategorized',
      };

      set(state => ({ items: [...state.items, item] }));
    } catch (err: any) {
      console.error('addItem error:', err.message);
      throw err;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: updates.name,
          unit: updates.unit,
          weight_volume_value: updates.weight_volume_value,
          weight_volume_unit: updates.weight_volume_unit,
          quantity: updates.quantity,
          low_stock_threshold: updates.threshold,
          category_id: updates.category_id,
        })
        .eq('id', id);

      if (error) throw error;
      get().fetchItems();
    } catch (err: any) {
      console.error('updateItem error:', err.message);
      throw err;
    }
  },

  deleteItem: async (id) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set(state => ({ items: state.items.filter(i => i.id !== id) }));
    } catch (err: any) {
      console.error('deleteItem error:', err.message);
      throw err;
    }
  },
}));
