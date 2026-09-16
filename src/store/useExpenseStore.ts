import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Expense, ExpenseInput, ExpenseType, CategoryId } from './types';
import { generateId } from '../utils/id';

export interface ExpenseState {
  expenses: Expense[];
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: Partial<ExpenseInput>) => void;
  deleteExpense: (id: string) => void;
  markAllPendingAsTransferred: () => void;
  toggleTransferred: (id: string) => void;
  resetAllData: () => void;
  importExpenses: (expenses: Expense[]) => void;
  assignExpensesToPeriod: (expenseIds: string[], periodId: string | null) => void;
}

type SyncListener = (action: 'push' | 'delete', item: Expense | string) => void;
let syncListener: SyncListener | null = null;

export function registerSyncListener(listener: SyncListener) {
  syncListener = listener;
}

const STORAGE_KEY = 'delayspend_storage_v1';

function sanitizeExpense(raw: unknown): Expense | null {
  if (!raw || typeof raw !== 'object') return null;

  const item = raw as Record<string, unknown>;

  if (typeof item.id !== 'string' || !item.id) return null;
  if (item.type !== 'real' && item.type !== 'delayed') return null;

  const amount = Number(item.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const categoryId = (typeof item.categoryId === 'string' ? item.categoryId : 'other') as CategoryId;
  const date = typeof item.date === 'string' && item.date ? item.date : new Date().toISOString().split('T')[0]!;
  const transferredAt = typeof item.transferredAt === 'string' ? item.transferredAt : null;
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
  const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : createdAt;
  const periodId = typeof item.periodId === 'string' && item.periodId ? item.periodId : null;
  const savedExtraAmount =
    typeof item.savedExtraAmount === 'number' && item.savedExtraAmount > 0
      ? Math.round(item.savedExtraAmount * 100) / 100
      : undefined;
  const linkedExpenseId = typeof item.linkedExpenseId === 'string' && item.linkedExpenseId ? item.linkedExpenseId : null;

  return {
    id: item.id,
    type: item.type as ExpenseType,
    amount: Math.round(amount * 100) / 100,
    description,
    categoryId,
    date,
    transferredAt: item.type === 'real' ? null : transferredAt,
    createdAt,
    updatedAt,
    periodId,
    savedExtraAmount,
    linkedExpenseId,
  };
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],

      addExpense: (input: ExpenseInput) => {
        const now = new Date().toISOString();
        const expenseId = generateId();
        const savedExtra =
          input.type === 'real' && input.savedExtraAmount && input.savedExtraAmount > 0
            ? Math.round(input.savedExtraAmount * 100) / 100
            : undefined;

        const newExpense: Expense = {
          id: expenseId,
          type: input.type,
          amount: Math.round(Number(input.amount) * 100) / 100,
          description: input.description.trim(),
          categoryId: input.categoryId,
          date: input.date,
          transferredAt: null,
          createdAt: now,
          updatedAt: now,
          periodId: input.periodId ?? null,
          savedExtraAmount: savedExtra,
          linkedExpenseId: input.linkedExpenseId ?? null,
        };

        const newExpenses: Expense[] = [newExpense];

        // Si es gasto real con ahorro por opción más barata, crear el gasto delayeado complementario
        let companionExpense: Expense | null = null;
        if (savedExtra && savedExtra > 0) {
          companionExpense = {
            id: generateId(),
            type: 'delayed',
            amount: savedExtra,
            description: `Ahorro opción más barata (${input.description.trim()})`,
            categoryId: input.categoryId,
            date: input.date,
            transferredAt: null,
            createdAt: now,
            updatedAt: now,
            periodId: input.periodId ?? null,
            linkedExpenseId: expenseId,
          };
          newExpenses.unshift(companionExpense);
        }

        set((state) => ({
          expenses: [...newExpenses, ...state.expenses],
        }));

        syncListener?.('push', newExpense);
        if (companionExpense) {
          syncListener?.('push', companionExpense);
        }

        return newExpense;
      },

      updateExpense: (id: string, input: Partial<ExpenseInput>) => {
        const now = new Date().toISOString();
        let updatedParent: Expense | null = null;
        let companionToPush: Expense | null = null;
        let companionToDeleteId: string | null = null;

        set((state) => {
          const parent = state.expenses.find((e) => e.id === id);
          if (!parent) return state;

          const updatedType = input.type ?? parent.type;
          const updatedAmount =
            input.amount !== undefined
              ? Math.round(Number(input.amount) * 100) / 100
              : parent.amount;
          const updatedDesc =
            input.description !== undefined
              ? input.description.trim()
              : parent.description;
          const updatedCat = input.categoryId ?? parent.categoryId;
          const updatedDate = input.date ?? parent.date;
          const updatedPeriodId =
            input.periodId !== undefined ? input.periodId : parent.periodId;
          const updatedSavedExtra =
            input.savedExtraAmount !== undefined
              ? (input.savedExtraAmount > 0 ? Math.round(input.savedExtraAmount * 100) / 100 : undefined)
              : parent.savedExtraAmount;

          updatedParent = {
            ...parent,
            type: updatedType,
            amount: updatedAmount,
            description: updatedDesc,
            categoryId: updatedCat,
            date: updatedDate,
            periodId: updatedPeriodId,
            savedExtraAmount: updatedType === 'real' ? updatedSavedExtra : undefined,
            transferredAt: updatedType === 'real' ? null : parent.transferredAt,
            updatedAt: now,
          };

          // Buscar si existe un gasto complementario ya vinculado
          const existingCompanion = state.expenses.find((e) => e.linkedExpenseId === id);

          let nextExpenses = state.expenses.map((e) => (e.id === id ? updatedParent! : e));

          if (updatedType === 'real' && updatedSavedExtra && updatedSavedExtra > 0) {
            if (existingCompanion) {
              // Actualizar el complementario existente
              companionToPush = {
                ...existingCompanion,
                amount: updatedSavedExtra,
                description: `Ahorro opción más barata (${updatedDesc})`,
                categoryId: updatedCat,
                date: updatedDate,
                periodId: updatedPeriodId,
                updatedAt: now,
              };
              nextExpenses = nextExpenses.map((e) =>
                e.id === existingCompanion.id ? companionToPush! : e
              );
            } else {
              // Crear nuevo complementario
              companionToPush = {
                id: generateId(),
                type: 'delayed',
                amount: updatedSavedExtra,
                description: `Ahorro opción más barata (${updatedDesc})`,
                categoryId: updatedCat,
                date: updatedDate,
                transferredAt: null,
                createdAt: now,
                updatedAt: now,
                periodId: updatedPeriodId,
                linkedExpenseId: id,
              };
              nextExpenses = [companionToPush, ...nextExpenses];
            }
          } else if (existingCompanion) {
            // Se quitó el ahorro extra: borrar el complementario
            companionToDeleteId = existingCompanion.id;
            nextExpenses = nextExpenses.filter((e) => e.id !== existingCompanion.id);
          }

          return { expenses: nextExpenses };
        });

        if (updatedParent) syncListener?.('push', updatedParent);
        if (companionToPush) syncListener?.('push', companionToPush);
        if (companionToDeleteId) syncListener?.('delete', companionToDeleteId);
      },

      deleteExpense: (id: string) => {
        let companionId: string | null = null;
        set((state) => {
          const companion = state.expenses.find((e) => e.linkedExpenseId === id);
          if (companion) companionId = companion.id;

          return {
            expenses: state.expenses.filter(
              (expense) => expense.id !== id && expense.linkedExpenseId !== id
            ),
          };
        });

        syncListener?.('delete', id);
        if (companionId) {
          syncListener?.('delete', companionId);
        }
      },

      assignExpensesToPeriod: (expenseIds: string[], periodId: string | null) => {
        const now = new Date().toISOString();
        const updatedList: Expense[] = [];

        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (expenseIds.includes(exp.id)) {
              const updated = {
                ...exp,
                periodId,
                updatedAt: now,
              };
              updatedList.push(updated);
              return updated;
            }
            return exp;
          }),
        }));

        for (const item of updatedList) {
          syncListener?.('push', item);
        }
      },

      markAllPendingAsTransferred: () => {
        const now = new Date().toISOString();
        const updatedList: Expense[] = [];

        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.type === 'delayed' && expense.transferredAt === null) {
              const updated = {
                ...expense,
                transferredAt: now,
                updatedAt: now,
              };
              updatedList.push(updated);
              return updated;
            }
            return expense;
          }),
        }));

        for (const item of updatedList) {
          syncListener?.('push', item);
        }
      },

      toggleTransferred: (id: string) => {
        const now = new Date().toISOString();
        let updatedItem: Expense | null = null;

        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id !== id || expense.type !== 'delayed') return expense;
            updatedItem = {
              ...expense,
              transferredAt: expense.transferredAt ? null : now,
              updatedAt: now,
            };
            return updatedItem;
          }),
        }));

        if (updatedItem) {
          syncListener?.('push', updatedItem);
        }
      },

      resetAllData: () => {
        set({ expenses: [] });
      },

      importExpenses: (importedExpenses: Expense[]) => {
        const valid = importedExpenses
          .map(sanitizeExpense)
          .filter((item): item is Expense => item !== null);
        set({ expenses: valid });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { expenses: [] };
        }
        const state = persistedState as { expenses?: unknown[] };
        if (!Array.isArray(state.expenses)) {
          return { expenses: [] };
        }
        const cleanExpenses = state.expenses
          .map(sanitizeExpense)
          .filter((e): e is Expense => e !== null);

        return { expenses: cleanExpenses };
      },
    }
  )
);
