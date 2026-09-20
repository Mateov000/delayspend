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
  lastError: string | null;
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
  period_id?: string | null;
  saved_extra_amount?: number | null;
  linked_expense_id?: string | null;
  tags?: string[] | null;
  installment_group_id?: string | null;
  installment_number?: number | null;
  installment_total?: number | null;
  is_recurring?: boolean | null;
  nature?: string | null;
  is_fictitious?: boolean | null;
  subcategory?: string | null;
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
  cutoff_expense_id?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

function mapRowToExpense(row: DbExpenseRow): Expense {
  const savedExtra =
    row.saved_extra_amount && Number(row.saved_extra_amount) > 0
      ? Number(row.saved_extra_amount)
      : undefined;

  const validTypes = ['real', 'delayed', 'income'];
  const expenseType = validTypes.includes(row.type) ? (row.type as Expense['type']) : 'real';

  return {
    id: row.id,
    type: expenseType,
    amount: Number(row.amount),
    description: row.description,
    categoryId: row.category_id as Expense['categoryId'],
    date: row.date,
    transferredAt: row.transferred_at,
    periodId: row.period_id ?? null,
    savedExtraAmount: savedExtra,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
    installmentGroupId: row.installment_group_id ?? null,
    installmentNumber: row.installment_number ?? null,
    installmentTotal: row.installment_total ?? null,
    isRecurring: (row.nature === 'fixed' || Boolean(row.is_recurring)) ? true : undefined,
    nature: expenseType === 'real'
      ? ((row.nature === 'daily' || row.nature === 'fixed' || row.nature === 'eventual' || row.nature === 'house')
          ? (row.nature as Expense['nature'])
          : (row.is_recurring ? 'fixed' : 'daily'))
      : undefined,
    subcategory: (row.subcategory && row.subcategory.trim()) || undefined,
    isFictitious: Boolean(row.is_fictitious) || undefined,
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
    cutoffExpenseId: row.cutoff_expense_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function mapExpenseToRow(expense: Expense, userId: string): Omit<DbExpenseRow, 'deleted_at'> {
  return {
    id: expense.id,
    user_id: userId,
    type: expense.type,
    amount: expense.amount,
    description: expense.description,
    category_id: expense.categoryId,
    date: expense.date,
    transferred_at: expense.transferredAt,
    period_id: expense.periodId ?? null,
    saved_extra_amount: expense.savedExtraAmount ?? null,
    linked_expense_id: null,
    tags: expense.tags && expense.tags.length > 0 ? expense.tags : null,
    installment_group_id: expense.installmentGroupId ?? null,
    installment_number: expense.installmentNumber ?? null,
    installment_total: expense.installmentTotal ?? null,
    is_recurring: expense.isRecurring ?? false,
    nature: expense.type === 'real' ? (expense.nature ?? (expense.isRecurring ? 'fixed' : 'daily')) : null,
    is_fictitious: expense.isFictitious ?? false,
    subcategory: expense.subcategory ?? null,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
  };
}

/**
 * Envuelve cualquier promesa con un límite estricto de tiempo.
 * Vital para iOS WebKit donde peticiones fetch en sockets interrumpidos pueden colgarse indefinidamente.
 */
function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 8000,
  label = 'Operación de sincronización'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Timeout de red (${ms}ms) en ${label}`));
      }
    }, ms);

    Promise.resolve(promise)
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

// Variables de módulo para control de compatibilidad, concurrencia y watchdog
let supportsFictitiousAndSubcategory = true;
let activeSyncPromise: Promise<void> | null = null;
let lastSyncTimestamp = 0;
let syncingWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string; details?: string; hint?: string };
  const msg = String(err.message || err.details || err.hint || '').toLowerCase();
  return (
    err.code === '42703' ||
    msg.includes('is_fictitious') ||
    msg.includes('subcategory') ||
    msg.includes('schema cache')
  );
}

function sanitizeExpenseRow(
  row: Omit<DbExpenseRow, 'deleted_at'>,
  includeOptional: boolean
): Omit<DbExpenseRow, 'deleted_at'> {
  if (includeOptional) return row;
  const copy = { ...row };
  delete copy.is_fictitious;
  delete copy.subcategory;
  return copy;
}

async function upsertExpensesResilient(
  rows: Omit<DbExpenseRow, 'deleted_at'>[],
  timeoutMs = 8000
): Promise<{ error: Error | { message?: string } | null }> {
  if (rows.length === 0) return { error: null };

  const payload = supportsFictitiousAndSubcategory
    ? rows
    : rows.map((r) => sanitizeExpenseRow(r, false));

  const { error } = await withTimeout(
    supabase.from('expenses').upsert(payload),
    timeoutMs,
    'subida de gastos'
  );

  if (error && supportsFictitiousAndSubcategory && isMissingColumnError(error)) {
    console.warn('[Sync] Supabase no posee columnas is_fictitious/subcategory. Reintentando en modo compatible...');
    supportsFictitiousAndSubcategory = false;
    const fallbackPayload = rows.map((r) => sanitizeExpenseRow(r, false));
    return await withTimeout(
      supabase.from('expenses').upsert(fallbackPayload),
      timeoutMs,
      'subida de gastos (modo compatible)'
    );
  }

  return { error };
}

async function upsertSingleExpenseResilient(
  row: Omit<DbExpenseRow, 'deleted_at'>,
  timeoutMs = 6000
): Promise<{ error: Error | { message?: string } | null }> {
  const payload = supportsFictitiousAndSubcategory ? row : sanitizeExpenseRow(row, false);
  const { error } = await withTimeout(
    supabase.from('expenses').upsert(payload),
    timeoutMs,
    'pushExpense'
  );

  if (error && supportsFictitiousAndSubcategory && isMissingColumnError(error)) {
    console.warn('[Sync] Columna no disponible en tabla remota. Reintentando en modo compatible...');
    supportsFictitiousAndSubcategory = false;
    const fallbackPayload = sanitizeExpenseRow(row, false);
    return await withTimeout(
      supabase.from('expenses').upsert(fallbackPayload),
      timeoutMs,
      'pushExpense (modo compatible)'
    );
  }

  return { error };
}

function startSyncingWatchdog(set: (state: Partial<SyncState>) => void) {
  if (syncingWatchdogTimer) {
    clearTimeout(syncingWatchdogTimer);
  }
  // Si pasan más de 10 segundos en estado 'syncing', forzar a un estado seguro
  syncingWatchdogTimer = setTimeout(() => {
    const currentStatus = useSyncStore.getState().status;
    if (currentStatus === 'syncing') {
      console.warn('[Sync Watchdog] Sincronización excedió el tiempo límite (10s). Restaurando estado de interfaz.');
      set({ status: navigator.onLine ? 'synced' : 'offline' });
    }
  }, 10000);
}

function clearSyncingWatchdog() {
  if (syncingWatchdogTimer) {
    clearTimeout(syncingWatchdogTimer);
    syncingWatchdogTimer = null;
  }
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'guest',
  lastSyncedAt: null,
  lastError: null,

  setStatus: (status: SyncStatus) => set({ status }),

  initializeSync: (userId: string | null) => {
    if (!isSupabaseConfigured || !userId) {
      set({ status: 'guest' });
      registerSyncListener(() => {});
      registerPeriodSyncListener(() => {});
      return () => {};
    }

    // Registrar sincronizadores de acciones locales
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

    const scheduleSync = (uid: string, delay = 400) => {
      if (reconnectDebounceTimer) {
        clearTimeout(reconnectDebounceTimer);
      }
      reconnectDebounceTimer = setTimeout(() => {
        // En iOS, despertar el socket Realtime de Supabase si estaba suspendido
        try {
          if (supabase.realtime) {
            supabase.realtime.connect();
          }
        } catch {
          // Ignorar error si el cliente no lo soporta
        }
        get().syncAllWithCloud(uid);
      }, delay);
    };

    const handleOnline = () => {
      set({ status: 'syncing' });
      startSyncingWatchdog(set);
      scheduleSync(userId, 200);
    };

    const handleOffline = () => {
      if (reconnectDebounceTimer) {
        clearTimeout(reconnectDebounceTimer);
        reconnectDebounceTimer = null;
      }
      clearSyncingWatchdog();
      set({ status: 'offline' });
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        scheduleSync(userId, 300);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Sincronización inicial
    scheduleSync(userId, 100);

    let expenseChannel: RealtimeChannel | null = null;
    let periodChannel: RealtimeChannel | null = null;

    try {
      // Canal de Gastos
      expenseChannel = supabase
        .channel(`user_expenses_${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` },
          (payload) => {
            const { expenses } = useExpenseStore.getState();

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new as DbExpenseRow;
              if (row.deleted_at || row.linked_expense_id) {
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
                  useExpenseStore.setState({ expenses: [incoming, ...expenses] });
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

      // Canal de Períodos
      periodChannel = supabase
        .channel(`user_periods_${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'periods', filter: `user_id=eq.${userId}` },
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
                  usePeriodStore.setState({ periods: [incoming, ...periods] });
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
      set({ status: 'offline' });
    }

    return () => {
      if (reconnectDebounceTimer) {
        clearTimeout(reconnectDebounceTimer);
        reconnectDebounceTimer = null;
      }
      clearSyncingWatchdog();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      registerSyncListener(() => {});
      registerPeriodSyncListener(() => {});
      if (expenseChannel) supabase.removeChannel(expenseChannel);
      if (periodChannel) supabase.removeChannel(periodChannel);
    };
  },

  syncAllWithCloud: async (userId: string) => {
    if (!isSupabaseConfigured) {
      set({ status: 'guest' });
      return;
    }

    // Mutex: si ya hay una sincronización en marcha, reusar esa misma promesa
    if (activeSyncPromise) {
      return activeSyncPromise;
    }

    // Evitar ráfagas si acabamos de sincronizar hace menos de 800ms
    const now = Date.now();
    if (now - lastSyncTimestamp < 800 && get().status === 'synced') {
      return;
    }

    set({ status: 'syncing' });
    startSyncingWatchdog(set);

    activeSyncPromise = (async () => {
      try {
        // En iOS, despertar el socket Realtime de Supabase si estaba suspendido
        try {
          if (supabase.realtime) {
            supabase.realtime.connect();
          }
        } catch {
          // Ignorar error si el cliente no lo soporta
        }

        // 1. SINCRONIZACIÓN DE PERÍODOS PRIMERO (para que los period_id de los gastos ya existan en la BD remota)
        const { data: remotePeriodRows, error: perError } = await withTimeout(
          supabase
            .from('periods')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null),
          8000,
          'descarga de períodos'
        );

        if (perError) {
          console.error('Error fetching remote periods:', perError);
          throw perError;
        }

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
            cutoff_expense_id: p.cutoffExpenseId ?? null,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          }));
          const { error: upsertPeriodError } = await withTimeout(
            supabase.from('periods').upsert(periodPayload),
            8000,
            'subida de períodos'
          );
          if (upsertPeriodError) {
            console.error('Error upserting periods to Supabase:', upsertPeriodError);
            throw upsertPeriodError;
          }
        }

        const allMergedPeriods = Array.from(mergedPeriodsMap.values()).sort(
          (a, b) => b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt)
        );
        usePeriodStore.getState().setPeriods(allMergedPeriods);

        // 2. SINCRONIZACIÓN DE GASTOS
        const { data: remoteRows, error: expError } = await withTimeout(
          supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null),
          8000,
          'descarga de gastos'
        );

        if (expError) {
          console.error('Error fetching remote expenses:', expError);
          throw expError;
        }

        // Filtrar registros legacy con linked_expense_id
        const remoteExpenses = (remoteRows as DbExpenseRow[])
          .filter((r) => !r.linked_expense_id)
          .map(mapRowToExpense);

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
          const payload = expensesToUpload.map((e) => mapExpenseToRow(e, userId));
          const { error: upsertExpError } = await upsertExpensesResilient(payload, 8000);
          if (upsertExpError) {
            console.error('Error upserting expenses to Supabase:', upsertExpError);
            throw upsertExpError;
          }
        }

        const allMergedExpenses = Array.from(mergedExpensesMap.values()).sort(
          (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
        );
        useExpenseStore.setState({ expenses: allMergedExpenses });

        lastSyncTimestamp = Date.now();
        set({ status: 'synced', lastSyncedAt: new Date().toISOString(), lastError: null });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err || 'Error de conexión');
        console.error('Sync error in syncAllWithCloud:', err);
        // Fallback seguro: nunca dejar 'syncing' infinito
        set({ status: 'offline', lastError: errorMsg });
      } finally {
        clearSyncingWatchdog();
        activeSyncPromise = null;
      }
    })();

    return activeSyncPromise;
  },

  pushExpense: async (expense: Expense, userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await upsertSingleExpenseResilient(mapExpenseToRow(expense, userId), 6000);
      if (error) {
        console.error('Error in pushExpense:', error);
        set({ status: 'offline', lastError: (error as { message?: string }).message || 'Error al guardar gasto' });
        return;
      }
      set({ status: 'synced', lastSyncedAt: new Date().toISOString(), lastError: null });
    } catch (err: unknown) {
      console.error('Exception in pushExpense:', err);
      set({ status: 'offline', lastError: err instanceof Error ? err.message : 'Error de conexión' });
    }
  },

  deleteRemoteExpense: async (id: string, userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await withTimeout(
        supabase
          .from('expenses')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId),
        6000,
        'deleteRemoteExpense'
      );
      if (error) {
        console.error('Error in deleteRemoteExpense:', error);
        set({ status: 'offline', lastError: error.message || 'Error al eliminar gasto' });
        return;
      }
      set({ status: 'synced', lastSyncedAt: new Date().toISOString(), lastError: null });
    } catch (err: unknown) {
      console.error('Exception in deleteRemoteExpense:', err);
      set({ status: 'offline', lastError: err instanceof Error ? err.message : 'Error de conexión' });
    }
  },

  pushPeriod: async (period: Period, userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await withTimeout(
        supabase.from('periods').upsert({
          id: period.id,
          user_id: userId,
          name: period.name,
          start_date: period.startDate,
          end_date: period.endDate,
          initial_income: period.initialIncome,
          cutoff_expense_id: period.cutoffExpenseId ?? null,
          created_at: period.createdAt,
          updated_at: period.updatedAt,
        }),
        6000,
        'pushPeriod'
      );
      if (error) {
        console.error('Error in pushPeriod:', error);
        set({ status: 'offline', lastError: error.message || 'Error al guardar período' });
        return;
      }
      set({ status: 'synced', lastSyncedAt: new Date().toISOString(), lastError: null });
    } catch (err: unknown) {
      console.error('Exception in pushPeriod:', err);
      set({ status: 'offline', lastError: err instanceof Error ? err.message : 'Error de conexión' });
    }
  },

  deleteRemotePeriod: async (id: string, userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await withTimeout(
        supabase
          .from('periods')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId),
        6000,
        'deleteRemotePeriod'
      );
      if (error) {
        console.error('Error in deleteRemotePeriod:', error);
        set({ status: 'offline', lastError: error.message || 'Error al eliminar período' });
        return;
      }
      set({ status: 'synced', lastSyncedAt: new Date().toISOString(), lastError: null });
    } catch (err: unknown) {
      console.error('Exception in deleteRemotePeriod:', err);
      set({ status: 'offline', lastError: err instanceof Error ? err.message : 'Error de conexión' });
    }
  },
}));
