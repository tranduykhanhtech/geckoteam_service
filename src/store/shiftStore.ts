import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useStoreStore } from './storeStore';

export interface Shift {
  id: string;
  store_id: string;
  opened_by: string;
  opened_at: string;
  opening_balance: number;
  closed_by: string | null;
  closed_at: string | null;
  closing_balance: number | null;
  expected_balance: number | null;
  status: 'open' | 'closed';
  notes: string | null;
}

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;
  error: string | null;

  fetchCurrentShift: () => Promise<void>;
  openShift: (openingBalance: number) => Promise<void>;
  closeShift: (closingBalance: number, expectedBalance: number, notes?: string) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,
  error: null,

  fetchCurrentShift: async () => {
    const { profile } = useAuthStore.getState();
    const { currentStoreId } = useStoreStore.getState();
    const targetStoreId = currentStoreId || profile?.store_id;

    if (!targetStoreId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('store_id', targetStoreId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
      }

      set({ currentShift: data as Shift || null });
    } catch (err: any) {
      console.error('Error fetching shift:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  openShift: async (openingBalance: number) => {
    const { profile } = useAuthStore.getState();
    const { currentStoreId } = useStoreStore.getState();
    const targetStoreId = currentStoreId || profile?.store_id;

    if (!targetStoreId || !profile?.id) throw new Error("Store or Profile not found");

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          store_id: targetStoreId,
          opened_by: profile.id,
          opening_balance: openingBalance,
          status: 'open'
        }])
        .select()
        .single();

      if (error) throw error;
      set({ currentShift: data as Shift });
    } catch (err: any) {
      console.error('Error opening shift:', err);
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  closeShift: async (closingBalance: number, expectedBalance: number, notes?: string) => {
    const { currentShift } = get();
    const { profile } = useAuthStore.getState();

    if (!currentShift || !profile?.id) throw new Error("No active shift found to close");

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('shifts')
        .update({
          status: 'closed',
          closed_by: profile.id,
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          expected_balance: expectedBalance,
          notes: notes || null
        })
        .eq('id', currentShift.id);

      if (error) throw error;
      set({ currentShift: null });
    } catch (err: any) {
      console.error('Error closing shift:', err);
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  }
}));
