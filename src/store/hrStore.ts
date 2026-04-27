import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface EmployeeProfile {
  id: string;
  staff_code: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
}

interface HRState {
  employees: EmployeeProfile[];
  isLoading: boolean;
  error: string | null;

  fetchEmployees: () => Promise<void>;
  updateRole: (id: string, newRole: 'admin' | 'manager' | 'staff') => Promise<void>;
  toggleStatus: (id: string, isActive: boolean) => Promise<void>;
}

export const useHRStore = create<HRState>((set) => ({
  employees: [],
  isLoading: false,
  error: null,

  fetchEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const companyId = useAuthStore.getState().profile?.company_id;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, staff_code, full_name, email, role, is_active, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map missing columns to defaults safely in case the DB doesn't have them yet
      const mapped = (data || []).map(row => ({
        ...row,
        email: row.email ?? null,
        is_active: row.is_active ?? true,
      })) as EmployeeProfile[];

      set({ employees: mapped });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateRole: async (id, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        employees: state.employees.map(emp => 
          emp.id === id ? { ...emp, role: newRole } : emp
        )
      }));
    } catch (err: any) {
      console.error('updateRole error:', err.message);
      throw err;
    }
  },

  toggleStatus: async (id, isActive) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      set(state => ({
        employees: state.employees.map(emp => 
          emp.id === id ? { ...emp, is_active: isActive } : emp
        )
      }));
    } catch (err: any) {
      console.error('toggleStatus error:', err.message);
      throw err;
    }
  }
}));
