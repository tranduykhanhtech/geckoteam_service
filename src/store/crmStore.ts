import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Customer {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  total_spent: number;
  visit_count: number;
  points: number;
  last_visit: string | null;
  created_at: string;
}

interface CRMState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;

  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'total_spent' | 'visit_count' | 'last_visit' | 'company_id' | 'points'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  recordPurchase: (customerId: string, amount: number) => Promise<void>;
}

export const useCRMStore = create<CRMState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const companyId = useAuthStore.getState().profile?.company_id;
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ customers: data || [] });
    } catch (err: any) {
      set({ error: err.message });
      console.error('fetchCustomers error:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomer: async (customerData) => {
    const { profile } = useAuthStore.getState();
    if (!profile?.company_id) throw new Error('No company ID found');

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, company_id: profile.company_id }])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ customers: [data, ...state.customers] }));
    } catch (err: any) {
      console.error('addCustomer error:', err.message);
      throw err;
    }
  },

  updateCustomer: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
      }));
    } catch (err: any) {
      console.error('updateCustomer error:', err.message);
      throw err;
    }
  },

  recordPurchase: async (customerId, amount) => {
    try {
      const { profile } = useAuthStore.getState();
      if (!profile?.company_id) return;

      // Fetch the store's conversion rate
      const { data: storeData } = await supabase
        .from('companies')
        .select('points_rate')
        .eq('id', profile.company_id)
        .single();
      
      const rate = storeData?.points_rate ? Number(storeData.points_rate) : 1;
      
      const customer = get().customers.find(c => c.id === customerId);
      if (!customer) return;

      const newTotalSpent = (customer.total_spent || 0) + amount;
      const newVisitCount = (customer.visit_count || 0) + 1;
      const newPoints = (customer.points || 0) + Math.floor(amount / rate); 
      const lastVisit = new Date().toISOString();

      const { error } = await supabase
        .from('customers')
        .update({
          total_spent: newTotalSpent,
          visit_count: newVisitCount,
          points: newPoints,
          last_visit: lastVisit
        })
        .eq('id', customerId);

      if (error) throw error;

      set(state => ({
        customers: state.customers.map(c => 
          c.id === customerId 
            ? { ...c, total_spent: newTotalSpent, visit_count: newVisitCount, points: newPoints, last_visit: lastVisit } 
            : c
        )
      }));
    } catch (err: any) {
      console.error('recordPurchase error:', err.message);
      throw err;
    }
  }
}));
