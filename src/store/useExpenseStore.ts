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

  // Limpiar/ignorar cualquier registro fantasma complementario antiguo
  if (item.linkedExpenseId) return null;

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

  return {
    id: item.id,
    type: item.type as ExpenseType,
    amount: Math.round(amount * 100) / 100,
    description,
    categoryId,
    date,
    transferredAt: item.type === 'real' && !savedExtraAmount ? null : transferredAt,
    createdAt,
    updatedAt,
    periodId,
    savedExtraAmount,
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
        };

        set((state) => ({
          // Se agrega como un único gasto directo y unificado, filtrando antiguos fantasmas si los hubiera
          expenses: [newExpense, ...state.expenses.filter((e) => !e.linkedExpenseId)],
        }));

        syncListener?.('push', newExpense);
        return newExpense;
      },

      updateExpense: (id: string, input: Partial<ExpenseInput>) => {
        const now = new Date().toISOString();
        let updatedItem: Expense | null = null;

        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id !== id) return expense;

            const updatedType = input.type ?? expense.type;
            const updatedAmount =
              input.amount !== undefined
                ? Math.round(Number(input.amount) * 100) / 100
                : expense.amount;
            const updatedDesc =
              input.description !== undefined
                ? input.description.trim()
                : expense.description;
            const updatedCat = input.categoryId ?? expense.categoryId;
            const updatedDate = input.date ?? expense.date;
            const updatedPeriodId =
              input.periodId !== undefined ? input.periodId : expense.periodId;
            const updatedSavedExtra =
              input.savedExtraAmount !== undefined
                ? (input.savedExtraAmount > 0 ? Math.round(input.savedExtraAmount * 100) / 100 : undefined)
                : expense.savedExtraAmount;

            updatedItem = {
              ...expense,
              type: updatedType,
              amount: updatedAmount,
              description: updatedDesc,
              categoryId: updatedCat,
              date: updatedDate,
              periodId: updatedPeriodId,
              savedExtraAmount: updatedType === 'real' ? updatedSavedExtra : undefined,
              transferredAt:
                updatedType === 'real' && !updatedSavedExtra ? null : expense.transferredAt,
              updatedAt: now,
            };

            return updatedItem;
          }),
        }));

        if (updatedItem) {
          syncListener?.('push', updatedItem);
        }
      },

      deleteExpense: (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id && !expense.linkedExpenseId),
        }));

        syncListener?.('delete', id);
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
            const isPendingDelayed = expense.type === 'delayed' && expense.transferredAt === null;
            const isPendingRealSavings =
              expense.type === 'real' &&
              Boolean(expense.savedExtraAmount && expense.savedExtraAmount > 0) &&
              expense.transferredAt === null;

            if (isPendingDelayed || isPendingRealSavings) {
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
            if (expense.id !== id) return expense;
            const canTransfer =
              expense.type === 'delayed' ||
              Boolean(expense.savedExtraAmount && expense.savedExtraAmount > 0);
            if (!canTransfer) return expense;

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
