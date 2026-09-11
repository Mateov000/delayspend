import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => () => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    if (!isSupabaseConfigured) {
      set({ isInitialized: true, isLoading: false });
      return () => {};
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        set({ isLoading: false });
        return { error };
      }
      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      set({ isLoading: false });
      return { error: err as Error };
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ isLoading: false });
        return { error };
      }
      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      set({ isLoading: false });
      return { error: err as Error };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },
}));

