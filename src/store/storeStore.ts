import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Store {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

interface StoreState {
  stores: Store[];
  currentStoreId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchStores: () => Promise<void>;
  createStore: (name: string, address?: string) => Promise<void>;
  setCurrentStore: (id: string) => void;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  stores: [],
  currentStoreId: null,
  isLoading: false,
  error: null,

  fetchStores: async () => {
    set({ isLoading: true });
    try {
      const companyId = useAuthStore.getState().profile?.company_id;
      if (!companyId) return;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      set({ stores: data || [] });

      // Auto-set current store if only one exists or from profile
      const profile = useAuthStore.getState().profile;
      if (profile?.store_id) {
        set({ currentStoreId: profile.store_id });
      } else if (data && data.length > 0 && !get().currentStoreId) {
        set({ currentStoreId: data[0].id });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createStore: async (name, address) => {
    const companyId = useAuthStore.getState().profile?.company_id;
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([{ company_id: companyId, name, address }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ stores: [...state.stores, data] }));
    } catch (err: any) {
      console.error('createStore error:', err.message);
      throw err;
    }
  },

  setCurrentStore: (id) => set({ currentStoreId: id }),
}));
