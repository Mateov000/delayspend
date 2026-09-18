import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Expense, ExpenseInput, ExpenseType, ExpenseNature, CategoryId } from './types';
import { generateId } from '../utils/id';
import { generateFutureInstallments } from '../utils/installments';

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
  if (item.type !== 'real' && item.type !== 'delayed' && item.type !== 'income') return null;

  // Descartar registros legacy complementarios (linkedExpenseId seteado)
  if (item.linkedExpenseId) return null;

  const amount = Number(item.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const categoryId = (typeof item.categoryId === 'string' ? item.categoryId : 'other') as CategoryId;
  const date = typeof item.date === 'string' && item.date ? item.date : new Date().toISOString().split('T')[0]!;
  const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
  const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : createdAt;
  const periodId = typeof item.periodId === 'string' && item.periodId ? item.periodId : null;

  const rawSaved = item.savedExtraAmount;
  const savedExtraAmount =
    typeof rawSaved === 'number' && rawSaved > 0
      ? Math.round(rawSaved * 100) / 100
      : undefined;

  // transferredAt: solo aplica a gastos 'delayed' o 'real' con savedExtraAmount (no ingresos)
  const rawTransferredAt = typeof item.transferredAt === 'string' ? item.transferredAt : null;
  const transferredAt =
    item.type === 'income' || (item.type === 'real' && !savedExtraAmount) ? null : rawTransferredAt;

  // Tags: array de strings
  const rawTags = item.tags;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags.filter((t): t is string => typeof t === 'string' && t.length > 0)
    : [];

  // Cuotas
  const installmentGroupId =
    typeof item.installmentGroupId === 'string' && item.installmentGroupId
      ? item.installmentGroupId
      : null;
  const installmentNumber =
    typeof item.installmentNumber === 'number' ? item.installmentNumber : null;
  const installmentTotal =
    typeof item.installmentTotal === 'number' ? item.installmentTotal : null;

  const rawNature = item.nature;
  let nature: ExpenseNature | undefined = undefined;
  if (item.type === 'real') {
    if (rawNature === 'daily' || rawNature === 'fixed' || rawNature === 'eventual' || rawNature === 'house') {
      nature = rawNature;
    } else if (item.isRecurring) {
      nature = 'fixed';
    } else {
      nature = 'daily';
    }
  }
  const isRecurring = item.type === 'real' ? (nature === 'fixed' || Boolean(item.isRecurring)) : undefined;

  const subcategory =
    typeof item.subcategory === 'string' && item.subcategory.trim().length > 0
      ? item.subcategory.trim()
      : undefined;
  const isFictitious = Boolean(item.isFictitious);

  return {
    id: item.id,
    type: item.type as ExpenseType,
    amount: Math.round(amount * 100) / 100,
    description,
    categoryId,
    date,
    transferredAt,
    createdAt,
    updatedAt,
    periodId,
    savedExtraAmount,
    tags: tags.length > 0 ? tags : undefined,
    installmentGroupId,
    installmentNumber,
    installmentTotal,
    isRecurring,
    nature,
    subcategory,
    isFictitious: isFictitious || undefined,
  };
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],

      addExpense: (input: ExpenseInput) => {
        const now = new Date().toISOString();
        const savedExtra =
          input.type === 'real' && input.savedExtraAmount && input.savedExtraAmount > 0
            ? Math.round(Number(input.savedExtraAmount) * 100) / 100
            : undefined;

        const tags = input.tags && input.tags.length > 0 ? input.tags : undefined;

        // Si hay cuotas (solo en gastos reales), generamos un groupId compartido
        const hasInstallments =
          input.type === 'real' &&
          input.installmentTotal !== null &&
          input.installmentTotal !== undefined &&
          input.installmentTotal > 1;
        const installmentGroupId = hasInstallments ? (input.installmentGroupId ?? generateId()) : null;

        const newExpense: Expense = {
          id: generateId(),
          type: input.type,
          amount: Math.round(Number(input.amount) * 100) / 100,
          description: input.description.trim(),
          categoryId: input.categoryId || 'other',
          date: input.date,
          transferredAt: null,
          createdAt: now,
          updatedAt: now,
          periodId: input.periodId ?? null,
          savedExtraAmount: input.type === 'real' ? savedExtra : undefined,
          tags,
          installmentGroupId: input.type === 'real' ? installmentGroupId : null,
          installmentNumber: hasInstallments ? (input.installmentNumber ?? 1) : null,
          installmentTotal: hasInstallments ? input.installmentTotal : null,
          isRecurring: input.type === 'real' && (input.nature === 'fixed' || input.isRecurring) ? true : undefined,
          nature: input.type === 'real' ? (input.nature ?? (input.isRecurring ? 'fixed' : 'daily')) : undefined,
          subcategory: input.categoryId === 'vices' && input.subcategory ? input.subcategory.trim() : undefined,
          isFictitious: Boolean(input.isFictitious) || undefined,
        };

        // Generar cuotas futuras (delayed) si es un pago en cuotas
        const futureInstallments = hasInstallments
          ? generateFutureInstallments(newExpense, input, now)
          : [];

        set((state) => ({
          expenses: [
            newExpense,
            ...futureInstallments,
            ...state.expenses.filter((e) => !e.linkedExpenseId),
          ],
        }));

        syncListener?.('push', newExpense);
        for (const inst of futureInstallments) {
          syncListener?.('push', inst);
        }

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
              input.description !== undefined ? input.description.trim() : expense.description;
            const updatedCat = input.categoryId ?? expense.categoryId;
            const updatedDate = input.date ?? expense.date;
            const updatedPeriodId =
              input.periodId !== undefined ? input.periodId : expense.periodId;
            const updatedTags =
              input.tags !== undefined
                ? (input.tags.length > 0 ? input.tags : undefined)
                : expense.tags;

            // Manejo estricto de remoción o actualización del sobreprecio ahorrado
            let updatedSavedExtra: number | undefined = expense.savedExtraAmount;
            if (updatedType === 'real') {
              if ('savedExtraAmount' in input) {
                if (
                  input.savedExtraAmount !== null &&
                  input.savedExtraAmount !== undefined &&
                  input.savedExtraAmount > 0
                ) {
                  updatedSavedExtra = Math.round(Number(input.savedExtraAmount) * 100) / 100;
                } else {
                  updatedSavedExtra = undefined;
                }
              }
            } else {
              updatedSavedExtra = undefined;
            }

            // Cuotas (solo en real)
            const updatedInstallmentGroupId =
              updatedType === 'real'
                ? (input.installmentGroupId !== undefined ? input.installmentGroupId : expense.installmentGroupId)
                : null;
            const updatedInstallmentNumber =
              updatedType === 'real'
                ? (input.installmentNumber !== undefined ? input.installmentNumber : expense.installmentNumber)
                : null;
            const updatedInstallmentTotal =
              updatedType === 'real'
                ? (input.installmentTotal !== undefined ? input.installmentTotal : expense.installmentTotal)
                : null;
            let updatedNature: ExpenseNature | undefined = expense.nature;
            if (updatedType === 'real') {
              if ('nature' in input) {
                updatedNature = input.nature;
              } else if ('isRecurring' in input) {
                updatedNature = input.isRecurring ? 'fixed' : 'daily';
              }
            } else {
              updatedNature = undefined;
            }

            const updatedIsRecurring =
              updatedType === 'real'
                ? (updatedNature === 'fixed' || ('isRecurring' in input ? Boolean(input.isRecurring) : expense.isRecurring) ? true : undefined)
                : undefined;

            const updatedSubcategory =
              'subcategory' in input
                ? (input.subcategory ? input.subcategory.trim() : undefined)
                : expense.subcategory;

            const updatedIsFictitious =
              'isFictitious' in input
                ? (Boolean(input.isFictitious) || undefined)
                : expense.isFictitious;

            updatedItem = {
              ...expense,
              type: updatedType,
              amount: updatedAmount,
              description: updatedDesc,
              categoryId: updatedCat,
              date: updatedDate,
              periodId: updatedPeriodId,
              savedExtraAmount: updatedSavedExtra,
              transferredAt:
                updatedType === 'income' || (updatedType === 'real' && !updatedSavedExtra)
                  ? null
                  : expense.transferredAt,
              tags: updatedTags,
              installmentGroupId: updatedInstallmentGroupId,
              installmentNumber: updatedInstallmentNumber,
              installmentTotal: updatedInstallmentTotal,
              isRecurring: updatedIsRecurring,
              nature: updatedNature,
              subcategory: updatedCat === 'vices' ? updatedSubcategory : undefined,
              isFictitious: updatedIsFictitious,
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
          expenses: state.expenses.filter(
            (expense) => expense.id !== id && expense.linkedExpenseId !== id
          ),
        }));
        syncListener?.('delete', id);
      },

      assignExpensesToPeriod: (expenseIds: string[], periodId: string | null) => {
        const now = new Date().toISOString();
        const updatedList: Expense[] = [];

        set((state) => ({
          expenses: state.expenses.map((exp) => {
            if (expenseIds.includes(exp.id)) {
              const updated = { ...exp, periodId, updatedAt: now };
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
              const updated = { ...expense, transferredAt: now, updatedAt: now };
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
