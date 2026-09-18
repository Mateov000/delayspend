import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CategoryId, BudgetPeriodType } from './types';
import { generateId } from '../utils/id';

export interface CategoryBudget {
  id: string;
  categoryId: CategoryId;
  amount: number; // Presupuesto de ciclo (legacy / compatibilidad)
  weeklyAmount?: number; // Meta semanal por categoría
  monthlyAmount?: number; // Meta mensual por categoría
  customAmount?: number; // Meta personalizada por categoría
  createdAt: string;
  updatedAt: string;
}

export interface BudgetState {
  budgets: CategoryBudget[];
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  cycleLimit: number | null;
  customLimit: number | null;
  goalPeriodType: BudgetPeriodType;
  customGoalDays: number;

  // Configuración de periodicidad y límites globales
  setGoalPeriodType: (type: BudgetPeriodType) => void;
  setCustomGoalDays: (days: number) => void;
  setGlobalLimit: (periodType: BudgetPeriodType, amount: number | null) => void;
  getGlobalLimit: (periodType: BudgetPeriodType) => number | null;

  // Presupuestos por categoría según periodicidad
  setCategoryBudget: (categoryId: CategoryId, periodType: BudgetPeriodType, amount: number) => void;
  getCategoryBudget: (categoryId: CategoryId, periodType: BudgetPeriodType) => number;
  removeCategoryBudget: (categoryId: CategoryId, periodType: BudgetPeriodType) => void;

  // Métodos legacy para compatibilidad retroactiva
  setBudget: (categoryId: CategoryId, amount: number) => void;
  removeBudget: (categoryId: CategoryId) => void;
  getBudgetForCategory: (categoryId: CategoryId) => number;
  setWeeklyBudget: (categoryId: CategoryId, amount: number) => void;
  removeWeeklyBudget: (categoryId: CategoryId) => void;
  getWeeklyBudgetForCategory: (categoryId: CategoryId) => number;
  setWeeklyLimit: (amount: number | null) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      weeklyLimit: null,
      monthlyLimit: null,
      cycleLimit: null,
      customLimit: null,
      goalPeriodType: 'cycle',
      customGoalDays: 15,

      setGoalPeriodType: (type) => set({ goalPeriodType: type }),

      setCustomGoalDays: (days) => {
        const safeDays = Math.max(1, Math.min(365, Math.round(days)));
        set({ customGoalDays: safeDays });
      },

      setGlobalLimit: (periodType, amount) => {
        const safeAmount = amount !== null && amount > 0 ? Math.round(amount * 100) / 100 : null;
        if (periodType === 'weekly') {
          set({ weeklyLimit: safeAmount });
        } else if (periodType === 'monthly') {
          set({ monthlyLimit: safeAmount });
        } else if (periodType === 'cycle') {
          set({ cycleLimit: safeAmount });
        } else if (periodType === 'custom') {
          set({ customLimit: safeAmount });
        }
      },

      getGlobalLimit: (periodType) => {
        const state = get();
        if (periodType === 'weekly') return state.weeklyLimit;
        if (periodType === 'monthly') return state.monthlyLimit;
        if (periodType === 'cycle') return state.cycleLimit;
        if (periodType === 'custom') return state.customLimit;
        return null;
      },

      setCategoryBudget: (categoryId, periodType, amount) => {
        const now = new Date().toISOString();
        const safeAmount = Math.max(0, Math.round(amount * 100) / 100);
        const propName: keyof Pick<CategoryBudget, 'amount' | 'weeklyAmount' | 'monthlyAmount' | 'customAmount'> =
          periodType === 'cycle'
            ? 'amount'
            : periodType === 'weekly'
            ? 'weeklyAmount'
            : periodType === 'monthly'
            ? 'monthlyAmount'
            : 'customAmount';

        set((state) => {
          const existing = state.budgets.find((b) => b.categoryId === categoryId);

          if (!existing) {
            if (safeAmount <= 0) return state;
            const newBudget: CategoryBudget = {
              id: generateId(),
              categoryId,
              amount: periodType === 'cycle' ? safeAmount : 0,
              weeklyAmount: periodType === 'weekly' ? safeAmount : undefined,
              monthlyAmount: periodType === 'monthly' ? safeAmount : undefined,
              customAmount: periodType === 'custom' ? safeAmount : undefined,
              createdAt: now,
              updatedAt: now,
            };
            return { budgets: [...state.budgets, newBudget] };
          }

          const updated = state.budgets.map((b) => {
            if (b.categoryId !== categoryId) return b;
            return {
              ...b,
              [propName]: safeAmount > 0 ? safeAmount : (propName === 'amount' ? 0 : undefined),
              updatedAt: now,
            };
          });

          return { budgets: updated };
        });
      },

      getCategoryBudget: (categoryId, periodType) => {
        const b = get().budgets.find((item) => item.categoryId === categoryId);
        if (!b) return 0;
        if (periodType === 'cycle') return b.amount || 0;
        if (periodType === 'weekly') return b.weeklyAmount || 0;
        if (periodType === 'monthly') return b.monthlyAmount || 0;
        if (periodType === 'custom') return b.customAmount || 0;
        return 0;
      },

      removeCategoryBudget: (categoryId, periodType) => {
        get().setCategoryBudget(categoryId, periodType, 0);
      },

      // Métodos Legacy
      setBudget: (categoryId, amount) => {
        get().setCategoryBudget(categoryId, 'cycle', amount);
      },

      removeBudget: (categoryId) => {
        get().setCategoryBudget(categoryId, 'cycle', 0);
      },

      getBudgetForCategory: (categoryId) => {
        return get().getCategoryBudget(categoryId, 'cycle');
      },

      setWeeklyBudget: (categoryId, amount) => {
        get().setCategoryBudget(categoryId, 'weekly', amount);
      },

      removeWeeklyBudget: (categoryId) => {
        get().setCategoryBudget(categoryId, 'weekly', 0);
      },

      getWeeklyBudgetForCategory: (categoryId) => {
        return get().getCategoryBudget(categoryId, 'weekly');
      },

      setWeeklyLimit: (amount) => {
        get().setGlobalLimit('weekly', amount);
      },
    }),
    {
      name: 'delayspend_budgets_v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
