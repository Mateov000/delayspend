import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Period } from './types';
import { generateId } from '../utils/id';
import { useExpenseStore } from './useExpenseStore';

export interface CreatePeriodInput {
  name?: string;
  startDate?: string;
  initialIncome?: number;
  cutoffExpenseId?: string;
}

export interface PeriodState {
  periods: Period[];
  activePeriodId: string | 'all';

  // Acciones principales
  createCutoff: (input: CreatePeriodInput) => Period;
  undoLastCutoff: () => { success: boolean; message?: string };
  updatePeriod: (id: string, input: Partial<Period>) => void;
  deletePeriod: (id: string) => void;
  setActivePeriodId: (id: string | 'all') => void;
  getActivePeriod: () => Period | null;

  // Importación / Sincronización
  setPeriods: (periods: Period[]) => void;
}

type PeriodSyncListener = (action: 'push' | 'delete', item: Period | string) => void;
let periodSyncListener: PeriodSyncListener | null = null;

export function registerPeriodSyncListener(listener: PeriodSyncListener) {
  periodSyncListener = listener;
}

const STORAGE_KEY = 'delayspend_periods_v1';

function sanitizePeriod(raw: unknown): Period | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;
  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.name !== 'string') return null;
  if (typeof item.startDate !== 'string' || !item.startDate) return null;

  const initialIncome = Number(item.initialIncome) || 0;
  const endDate = typeof item.endDate === 'string' && item.endDate ? item.endDate : null;
  const cutoffExpenseId = typeof item.cutoffExpenseId === 'string' && item.cutoffExpenseId ? item.cutoffExpenseId : null;
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
  const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : createdAt;
  const deletedAt = typeof item.deletedAt === 'string' ? item.deletedAt : null;

  return {
    id: item.id,
    name: item.name,
    startDate: item.startDate,
    endDate,
    initialIncome: Math.round(initialIncome * 100) / 100,
    cutoffExpenseId,
    createdAt,
    updatedAt,
    deletedAt,
  };
}

// Función auxiliar para obtener la fecha de ayer a partir de una fecha YYYY-MM-DD
function getDayBefore(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0]!;
}


export function getLatestPeriod(periods: Period[]): Period | null {
  if (periods.length === 0) return null;
  const openPeriod = periods.find((p) => p.endDate === null && !p.deletedAt);
  if (openPeriod) return openPeriod;
  return [...periods]
    .filter((p) => !p.deletedAt)
    .sort((a, b) => {
      const diff = b.startDate.localeCompare(a.startDate);
      if (diff !== 0) return diff;
      return b.createdAt.localeCompare(a.createdAt);
    })[0] ?? null;
}

export const usePeriodStore = create<PeriodState>()(
  persist(
    (set, get) => ({
      periods: [],
      activePeriodId: 'all',

      getActivePeriod: () => {
        const { periods, activePeriodId } = get();
        if (activePeriodId === 'all') return null;
        return periods.find((p) => p.id === activePeriodId) ?? null;
      },

      createCutoff: (input: CreatePeriodInput) => {
        const now = new Date().toISOString();
        const today = now.split('T')[0]!;
        let startDate = input.startDate || today;
        const initialIncome = Math.max(0, Math.round((Number(input.initialIncome) || 0) * 100) / 100);

        // Si se eligió un gasto específico de corte, sincronizamos la fecha de inicio
        const allExpenses = useExpenseStore.getState().expenses;
        let cutoffExpense = null;
        if (input.cutoffExpenseId) {
          cutoffExpense = allExpenses.find((e) => e.id === input.cutoffExpenseId) || null;
          if (cutoffExpense) {
            startDate = cutoffExpense.date;
          }
        }

        const currentPeriods = [...get().periods];
        const updatedList: Period[] = [];
        let prevPeriodId: string | null = null;

        // 1. Si existe un período abierto actual (endDate === null), lo cerramos
        const openIndex = currentPeriods.findIndex((p) => p.endDate === null);
        if (openIndex >= 0) {
          const openPeriod = currentPeriods[openIndex]!;
          prevPeriodId = openPeriod.id;
          const closedEndDate = cutoffExpense ? cutoffExpense.date : getDayBefore(startDate);
          const closedPeriod: Period = {
            ...openPeriod,
            endDate: closedEndDate >= openPeriod.startDate ? closedEndDate : openPeriod.startDate,
            updatedAt: now,
          };
          currentPeriods[openIndex] = closedPeriod;
          updatedList.push(closedPeriod);
          periodSyncListener?.('push', closedPeriod);
        } else if (currentPeriods.length === 0) {
          // Si no había ningún período creado previamente, creamos un "Período Inicial" para el historial previo
          const initialPeriodId = generateId();
          prevPeriodId = initialPeriodId;
          const initialPeriod: Period = {
            id: initialPeriodId,
            name: 'Período Inicial',
            startDate: '2026-01-01',
            endDate: cutoffExpense ? cutoffExpense.date : getDayBefore(startDate),
            initialIncome: 0,
            createdAt: now,
            updatedAt: now,
          };
          currentPeriods.push(initialPeriod);
          updatedList.push(initialPeriod);
          periodSyncListener?.('push', initialPeriod);
        }

        // 2. Crear el nuevo período activo
        const nextPeriodNumber = currentPeriods.length + 1;
        const newPeriodName = input.name?.trim() || `Período ${nextPeriodNumber}`;

        const newPeriod: Period = {
          id: generateId(),
          name: newPeriodName,
          startDate,
          endDate: null,
          initialIncome,
          cutoffExpenseId: input.cutoffExpenseId || null,
          createdAt: now,
          updatedAt: now,
        };

        // 3. Reasignar gastos por periodId
        if (input.cutoffExpenseId) {
          // Ordenar cronológicamente
          const sorted = [...allExpenses].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.createdAt.localeCompare(b.createdAt);
          });
          const cutoffIdx = sorted.findIndex((e) => e.id === input.cutoffExpenseId);
          if (cutoffIdx >= 0) {
            const newPeriodExpenseIds = sorted.slice(cutoffIdx).map((e) => e.id);
            const prevExpenseIds = sorted.slice(0, cutoffIdx).map((e) => e.id);

            useExpenseStore.getState().assignExpensesToPeriod(newPeriodExpenseIds, newPeriod.id);
            if (prevPeriodId) {
              useExpenseStore.getState().assignExpensesToPeriod(prevExpenseIds, prevPeriodId);
            }
          }
        } else {
          // Si es por fecha, asignar a newPeriod todos los gastos a partir de startDate que no tengan período
          const fromDateExpenseIds = allExpenses
            .filter((e) => e.date >= startDate && (!e.periodId || e.periodId === prevPeriodId))
            .map((e) => e.id);
          if (fromDateExpenseIds.length > 0) {
            useExpenseStore.getState().assignExpensesToPeriod(fromDateExpenseIds, newPeriod.id);
          }
        }

        const finalPeriods = [newPeriod, ...currentPeriods];

        set({
          periods: finalPeriods,
          activePeriodId: newPeriod.id,
        });

        periodSyncListener?.('push', newPeriod);
        return newPeriod;
      },

      undoLastCutoff: () => {
        const now = new Date().toISOString();
        const currentPeriods = [...get().periods];

        if (currentPeriods.length < 2) {
          return { success: false, message: 'No hay un corte anterior para deshacer.' };
        }

        const sorted = [...currentPeriods].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const newestPeriod = sorted[0];
        const previousPeriod = sorted[1];

        if (!newestPeriod || !previousPeriod) {
          return { success: false, message: 'No se encontraron períodos suficientes.' };
        }

        // 1. Reasignar todos los gastos del período nuevo de vuelta al anterior
        const allExpenses = useExpenseStore.getState().expenses;
        const expensesToRevert = allExpenses
          .filter((e) => e.periodId === newestPeriod.id)
          .map((e) => e.id);

        if (expensesToRevert.length > 0) {
          useExpenseStore.getState().assignExpensesToPeriod(expensesToRevert, previousPeriod.id);
        }

        // 2. Eliminar el período más nuevo
        const remainingPeriods = currentPeriods.filter((p) => p.id !== newestPeriod.id);

        // 3. Reabrir el período inmediatamente anterior (endDate: null)
        const updatedPrevious: Period = {
          ...previousPeriod,
          endDate: null,
          updatedAt: now,
        };

        const finalPeriods = remainingPeriods.map((p) =>
          p.id === updatedPrevious.id ? updatedPrevious : p
        );

        set({
          periods: finalPeriods,
          activePeriodId: updatedPrevious.id,
        });

        periodSyncListener?.('delete', newestPeriod.id);
        periodSyncListener?.('push', updatedPrevious);

        return { success: true };
      },

      updatePeriod: (id: string, input: Partial<Period>) => {
        const now = new Date().toISOString();
        let updatedItem: Period | null = null;

        set((state) => ({
          periods: state.periods.map((p) => {
            if (p.id !== id) return p;

            updatedItem = {
              ...p,
              name: input.name !== undefined ? input.name.trim() : p.name,
              startDate: input.startDate ?? p.startDate,
              endDate: input.endDate !== undefined ? input.endDate : p.endDate,
              initialIncome:
                input.initialIncome !== undefined
                  ? Math.max(0, Math.round(Number(input.initialIncome) * 100) / 100)
                  : p.initialIncome,
              updatedAt: now,
            };

            return updatedItem;
          }),
        }));

        if (updatedItem) {
          periodSyncListener?.('push', updatedItem);
        }
      },

      deletePeriod: (id: string) => {
        const { periods, activePeriodId } = get();
        const updated = periods.filter((p) => p.id !== id);

        set({
          periods: updated,
          activePeriodId: activePeriodId === id ? 'all' : activePeriodId,
        });

        periodSyncListener?.('delete', id);
      },

      setActivePeriodId: (id: string | 'all') => {
        set({ activePeriodId: id });
      },

      setPeriods: (newPeriods: Period[]) => {
        const valid = newPeriods
          .map(sanitizePeriod)
          .filter((p): p is Period => p !== null && !p.deletedAt);

        set((state) => {
          // Si el activePeriodId ya no existe en los nuevos períodos, elegimos el abierto o 'all'
          const openPeriod = valid.find((p) => p.endDate === null);
          const stillExists = valid.some((p) => p.id === state.activePeriodId);

          return {
            periods: valid,
            activePeriodId: stillExists
              ? state.activePeriodId
              : openPeriod
              ? openPeriod.id
              : 'all',
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { periods: [], activePeriodId: 'all' };
        }
        const state = persistedState as { periods?: unknown[]; activePeriodId?: string };
        const cleanPeriods = Array.isArray(state.periods)
          ? state.periods.map(sanitizePeriod).filter((p): p is Period => p !== null)
          : [];

        return {
          periods: cleanPeriods,
          activePeriodId: state.activePeriodId || 'all',
        };
      },
    }
  )
);

