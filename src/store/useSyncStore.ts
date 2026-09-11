import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Expense } from './types';
import { useExpenseStore, registerSyncListener } from './useExpenseStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'guest';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  setStatus: (status: SyncStatus) => void;
  initializeSync: (userId: string | null) => () => void;
  pushExpense: (expense: Expense, userId: string) => Promise<void>;
  deleteRemoteExpense: (id: string, userId: string) => Promise<void>;
  syncAllWithCloud: (userId: string) => Promise<void>;
}

interface DbExpenseRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  category_id: string;
  date: string;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

function mapRowToExpense(row: DbExpenseRow): Expense {
  return {
    id: row.id,
    type: row.type === 'real' ? 'real' : 'delayed',
    amount: Number(row.amount),
    description: row.description,
    categoryId: row.category_id as Expense['categoryId'],
    date: row.date,
    transferredAt: row.transferred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'guest',
  lastSyncedAt: null,

  setStatus: (status: SyncStatus) => set({ status }),

  initializeSync: (userId: string | null) => {
    if (!isSupabaseConfigured || !userId) {
      set({ status: 'guest' });
      registerSyncListener(() => {});
      return () => {};
    }

    // Registrar sincronizador de acciones locales
    registerSyncListener((action, item) => {
      if (action === 'push') {
        get().pushExpense(item as Expense, userId);
      } else {
        get().deleteRemoteExpense(item as string, userId);
      }
    });

    if (!navigator.onLine) {
      set({ status: 'offline' });
    } else {
      set({ status: 'syncing' });
      get().syncAllWithCloud(userId);
    }

    const handleOnline = () => {
      set({ status: 'syncing' });
      get().syncAllWithCloud(userId);
    };

    const handleOffline = () => {
      set({ status: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar cambios en tiempo real vía WebSocket
    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase
        .channel(`user_expenses_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const { expenses } = useExpenseStore.getState();

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new as DbExpenseRow;
              if (row.deleted_at) {
                // Si viene marcado como borrado
                useExpenseStore.getState().deleteExpense(row.id);
              } else {
                const incomingExpense = mapRowToExpense(row);
                const existingIndex = expenses.findIndex((e) => e.id === incomingExpense.id);

                if (existingIndex >= 0) {
                  const current = expenses[existingIndex];
                  if (current && new Date(incomingExpense.updatedAt) > new Date(current.updatedAt)) {
                    useExpenseStore.getState().updateExpense(incomingExpense.id, incomingExpense);
                  }
                } else {
                  useExpenseStore.setState({
                    expenses: [incomingExpense, ...expenses],
                  });
                }
              }
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as { id?: string };
              if (oldRow?.id) {
                useExpenseStore.getState().deleteExpense(oldRow.id);
              }
            }

            set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
          }
        )
        .subscribe();
    } catch {
      // Ignorar errores de websocket en modo degradado
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  },

  syncAllWithCloud: async (userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      set({ status: 'offline' });
      return;
    }

    set({ status: 'syncing' });

    try {
      // 1. Obtener gastos remotos de Supabase
      const { data: remoteRows, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) throw error;

      const remoteExpenses = (remoteRows as DbExpenseRow[]).map(mapRowToExpense);
      const localExpenses = useExpenseStore.getState().expenses;

      // 2. Resolver mapa por ID (merge bidireccional)
      const mergedMap = new Map<string, Expense>();

      // Agregar remotos primero
      for (const remote of remoteExpenses) {
        mergedMap.set(remote.id, remote);
      }

      // Procesar locales: si no están en remoto o son más nuevos, se suben
      const toUpload: Expense[] = [];

      for (const local of localExpenses) {
        const remote = mergedMap.get(local.id);
        if (!remote) {
          toUpload.push(local);
          mergedMap.set(local.id, local);
        } else if (new Date(local.updatedAt) > new Date(remote.updatedAt)) {
          toUpload.push(local);
          mergedMap.set(local.id, local);
        }
      }

      // Subir a Supabase en lote los que falten
      if (toUpload.length > 0) {
        const payload = toUpload.map((e) => ({
          id: e.id,
          user_id: userId,
          type: e.type,
          amount: e.amount,
          description: e.description,
          category_id: e.categoryId,
          date: e.date,
          transferred_at: e.transferredAt,
          created_at: e.createdAt,
          updated_at: e.updatedAt,
        }));

        await supabase.from('expenses').upsert(payload);
      }

      // 3. Actualizar estado local ordenado descendentemente
      const allMerged = Array.from(mergedMap.values()).sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );

      useExpenseStore.setState({ expenses: allMerged });
      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },

  pushExpense: async (expense: Expense, userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      return;
    }

    try {
      await supabase.from('expenses').upsert({
        id: expense.id,
        user_id: userId,
        type: expense.type,
        amount: expense.amount,
        description: expense.description,
        category_id: expense.categoryId,
        date: expense.date,
        transferred_at: expense.transferredAt,
        created_at: expense.createdAt,
        updated_at: expense.updatedAt,
      });
      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },

  deleteRemoteExpense: async (id: string, userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      return;
    }

    try {
      // Soft-delete para propagación
      await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },
}));
