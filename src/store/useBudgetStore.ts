import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CategoryId } from './types';
import { generateId } from '../utils/id';

export interface CategoryBudget {
  id: string;
  categoryId: CategoryId;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetState {
  budgets: CategoryBudget[];
  weeklyLimit: number | null;
  /** Establece (crea o reemplaza) el presupuesto de una categoría. amount=0 lo elimina. */
  setBudget: (categoryId: CategoryId, amount: number) => void;
  /** Elimina el presupuesto de una categoría */
  removeBudget: (categoryId: CategoryId) => void;
  /** Devuelve el límite de presupuesto para una categoría (0 = sin límite) */
  getBudgetForCategory: (categoryId: CategoryId) => number;
  /** Configura o remueve el límite de gasto semanal global */
  setWeeklyLimit: (amount: number | null) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      weeklyLimit: null,

      setBudget: (categoryId, amount) => {
        const now = new Date().toISOString();
        set((state) => {
          const existing = state.budgets.find((b) => b.categoryId === categoryId);
          if (amount <= 0) {
            return { budgets: state.budgets.filter((b) => b.categoryId !== categoryId) };
          }
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.categoryId === categoryId ? { ...b, amount, updatedAt: now } : b
              ),
            };
          }
          const newBudget: CategoryBudget = {
            id: generateId(),
            categoryId,
            amount,
            createdAt: now,
            updatedAt: now,
          };
          return { budgets: [...state.budgets, newBudget] };
        });
      },

      removeBudget: (categoryId) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.categoryId !== categoryId),
        }));
      },

      getBudgetForCategory: (categoryId) => {
        const b = get().budgets.find((b) => b.categoryId === categoryId);
        return b ? b.amount : 0;
      },

      setWeeklyLimit: (amount) => {
        set({ weeklyLimit: amount !== null && amount > 0 ? Math.round(amount * 100) / 100 : null });
      },
    }),
    {
      name: 'delayspend_budgets_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
