import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  company_id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
}

interface AuthState {
  user: User | null;
  session: any | null; // Use any for brevity or import Session from @supabase/supabase-js
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  initialize: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user, session, isAuthenticated: true });
        fetchProfile(session.user.id);
      } else {
        set({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false });
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: session.user, session, isAuthenticated: true, isLoading: true });
        fetchProfile(session.user.id);
      } else {
        set({ user: null, session: null, profile: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isAuthenticated: false });
  }
}));

// Helper to fetch the profile data and attach to store
async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    useAuthStore.setState({ profile: data as Profile, isLoading: false });
  } catch (error) {
    console.error("Error fetching profile:", error);
    useAuthStore.setState({ profile: null, isLoading: false });
  }
}
