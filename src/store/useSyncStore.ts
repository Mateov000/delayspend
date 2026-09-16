import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Expense, Period } from './types';
import { useExpenseStore, registerSyncListener } from './useExpenseStore';
import { usePeriodStore, registerPeriodSyncListener } from './usePeriodStore';
import { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'guest';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  setStatus: (status: SyncStatus) => void;
  initializeSync: (userId: string | null) => () => void;
  pushExpense: (expense: Expense, userId: string) => Promise<void>;
  deleteRemoteExpense: (id: string, userId: string) => Promise<void>;
  pushPeriod: (period: Period, userId: string) => Promise<void>;
  deleteRemotePeriod: (id: string, userId: string) => Promise<void>;
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

interface DbPeriodRow {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  initial_income: number;
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

function mapRowToPeriod(row: DbPeriodRow): Period {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    initialIncome: Number(row.initial_income) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
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
      registerPeriodSyncListener(() => {});
      return () => {};
    }

    // Registrar sincronizadores de acciones locales de gastos y períodos
    registerSyncListener((action, item) => {
      if (action === 'push') {
        get().pushExpense(item as Expense, userId);
      } else {
        get().deleteRemoteExpense(item as string, userId);
      }
    });

    registerPeriodSyncListener((action, item) => {
      if (action === 'push') {
        get().pushPeriod(item as Period, userId);
      } else {
        get().deleteRemotePeriod(item as string, userId);
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

    // Canales WebSocket en tiempo real para expenses y periods
    let expenseChannel: RealtimeChannel | null = null;
    let periodChannel: RealtimeChannel | null = null;

    try {
      // 1. Canal de Gastos
      expenseChannel = supabase
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
                useExpenseStore.getState().deleteExpense(row.id);
              } else {
                const incoming = mapRowToExpense(row);
                const existingIndex = expenses.findIndex((e) => e.id === incoming.id);

                if (existingIndex >= 0) {
                  const current = expenses[existingIndex];
                  if (current && new Date(incoming.updatedAt) > new Date(current.updatedAt)) {
                    useExpenseStore.getState().updateExpense(incoming.id, incoming);
                  }
                } else {
                  useExpenseStore.setState({
                    expenses: [incoming, ...expenses],
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

      // 2. Canal de Períodos
      periodChannel = supabase
        .channel(`user_periods_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'periods',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const { periods } = usePeriodStore.getState();

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new as DbPeriodRow;
              if (row.deleted_at) {
                usePeriodStore.getState().deletePeriod(row.id);
              } else {
                const incoming = mapRowToPeriod(row);
                const existingIndex = periods.findIndex((p) => p.id === incoming.id);

                if (existingIndex >= 0) {
                  const current = periods[existingIndex];
                  if (current && new Date(incoming.updatedAt) > new Date(current.updatedAt)) {
                    usePeriodStore.getState().updatePeriod(incoming.id, incoming);
                  }
                } else {
                  usePeriodStore.setState({
                    periods: [incoming, ...periods],
                  });
                }
              }
            } else if (payload.eventType === 'DELETE') {
              const oldRow = payload.old as { id?: string };
              if (oldRow?.id) {
                usePeriodStore.getState().deletePeriod(oldRow.id);
              }
            }

            set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
          }
        )
        .subscribe();
    } catch {
      // Degradar silenciosamente si no hay websockets
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (expenseChannel) supabase.removeChannel(expenseChannel);
      if (periodChannel) supabase.removeChannel(periodChannel);
    };
  },

  syncAllWithCloud: async (userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      set({ status: 'offline' });
      return;
    }

    set({ status: 'syncing' });

    try {
      // 1. SINCRONIZACIÓN DE GASTOS
      const { data: remoteRows, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (expError) throw expError;

      const remoteExpenses = (remoteRows as DbExpenseRow[]).map(mapRowToExpense);
      const localExpenses = useExpenseStore.getState().expenses;

      const mergedExpensesMap = new Map<string, Expense>();
      for (const remote of remoteExpenses) {
        mergedExpensesMap.set(remote.id, remote);
      }

      const expensesToUpload: Expense[] = [];
      for (const local of localExpenses) {
        const remote = mergedExpensesMap.get(local.id);
        if (!remote) {
          expensesToUpload.push(local);
          mergedExpensesMap.set(local.id, local);
        } else if (new Date(local.updatedAt) > new Date(remote.updatedAt)) {
          expensesToUpload.push(local);
          mergedExpensesMap.set(local.id, local);
        }
      }

      if (expensesToUpload.length > 0) {
        const payload = expensesToUpload.map((e) => ({
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

      const allMergedExpenses = Array.from(mergedExpensesMap.values()).sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
      useExpenseStore.setState({ expenses: allMergedExpenses });

      // 2. SINCRONIZACIÓN DE PERÍODOS
      const { data: remotePeriodRows, error: perError } = await supabase
        .from('periods')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (perError) throw perError;

      const remotePeriods = (remotePeriodRows as DbPeriodRow[]).map(mapRowToPeriod);
      const localPeriods = usePeriodStore.getState().periods;

      const mergedPeriodsMap = new Map<string, Period>();
      for (const remote of remotePeriods) {
        mergedPeriodsMap.set(remote.id, remote);
      }

      const periodsToUpload: Period[] = [];
      for (const local of localPeriods) {
        const remote = mergedPeriodsMap.get(local.id);
        if (!remote) {
          periodsToUpload.push(local);
          mergedPeriodsMap.set(local.id, local);
        } else if (new Date(local.updatedAt) > new Date(remote.updatedAt)) {
          periodsToUpload.push(local);
          mergedPeriodsMap.set(local.id, local);
        }
      }

      if (periodsToUpload.length > 0) {
        const periodPayload = periodsToUpload.map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          start_date: p.startDate,
          end_date: p.endDate,
          initial_income: p.initialIncome,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        }));
        await supabase.from('periods').upsert(periodPayload);
      }

      const allMergedPeriods = Array.from(mergedPeriodsMap.values()).sort(
        (a, b) => b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt)
      );
      usePeriodStore.getState().setPeriods(allMergedPeriods);

      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },

  pushExpense: async (expense: Expense, userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
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
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
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

  pushPeriod: async (period: Period, userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      await supabase.from('periods').upsert({
        id: period.id,
        user_id: userId,
        name: period.name,
        start_date: period.startDate,
        end_date: period.endDate,
        initial_income: period.initialIncome,
        created_at: period.createdAt,
        updated_at: period.updatedAt,
      });
      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },

  deleteRemotePeriod: async (id: string, userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      await supabase
        .from('periods')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);
      set({ status: 'synced', lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ status: 'offline' });
    }
  },
}));
