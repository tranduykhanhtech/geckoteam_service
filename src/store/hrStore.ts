import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface EmployeeProfile {
  id: string;
  staff_code: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  store_id: string | null;
  store_name?: string | null;
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
      const session = useAuthStore.getState().session;
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Use Edge Function instead of direct query
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/get-employees`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      set({ employees: data.employees || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateRole: async (id: string, newRole: 'admin' | 'manager' | 'staff') => {
    try {
      const session = useAuthStore.getState().session;
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Use Edge Function instead of direct update
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/update-employee-role`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ employeeId: id, newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
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

  toggleStatus: async (id: string, isActive: boolean) => {
    try {
      const session = useAuthStore.getState().session;
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Use Edge Function instead of direct update
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/toggle-employee-status`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ employeeId: id, isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee status');
      }

      // Update local state
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
