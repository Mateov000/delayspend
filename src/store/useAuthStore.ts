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

function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (lower.includes('user already registered')) {
    return 'Este correo ya está registrado. Podés iniciar sesión directamente.';
  }
  if (lower.includes('invalid') && lower.includes('email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Límite de solicitudes alcanzado. Por favor esperá unos minutos.';
  }
  if (lower.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  return msg;
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
    const cleanEmail = email.trim().toLowerCase();
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: new Error(translateAuthError(error.message)) };
      }

      // Si el usuario se creó pero aún no hay sesión directa, logueamos de inmediato
      if (!data.session && data.user) {
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginRes.data.session) {
          set({
            session: loginRes.data.session,
            user: loginRes.data.user,
            isLoading: false,
          });
          return { error: null };
        }
      }

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      set({ isLoading: false });
      const rawMsg = err instanceof Error ? err.message : String(err);
      return { error: new Error(translateAuthError(rawMsg)) };
    }
  },

  signIn: async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: new Error(translateAuthError(error.message)) };
      }

      set({
        session: data.session,
        user: data.user,
        isLoading: false,
      });
      return { error: null };
    } catch (err) {
      set({ isLoading: false });
      const rawMsg = err instanceof Error ? err.message : String(err);
      return { error: new Error(translateAuthError(rawMsg)) };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },
}));

