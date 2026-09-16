import { Expense, CategoryId, Period } from '../store/types';

export interface CategorySpending {
  categoryId: CategoryId;
  spent: number;
  budget: number;
  hasBudget: boolean;
  /** Porcentaje gastado sobre el presupuesto (0-∞, puede superar 100) */
  percentage: number;
  isOver: boolean;
  isWarning: boolean;
}

export interface CategoryWeeklySpending {
  categoryId: CategoryId;
  spent: number;
  weeklyBudget: number;
  hasBudget: boolean;
  percentage: number;
  isOver: boolean;
  isWarning: boolean;
  remaining: number;
  daysRemaining: number;
  dailyAllowance: number;
}

export interface WeeklySpendingMetrics {
  spentThisWeek: number;
  weeklyLimit: number | null;
  remaining: number;
  percentage: number;
  isOver: boolean;
  isWarning: boolean;
  daysRemaining: number;
  dailyAllowance: number;
  startDateStr: string;
  endDateStr: string;
}

export interface PeriodGoalMetrics {
  spent: number;
  spentDaily: number;
  spentFixed: number;
  spentEventual: number;
  spentHouse: number;
  delayed: number;
  totalAccounted: number;
  income: number;
  baseIncome: number;
  extraIncome: number;
  remaining: number;
  percentage: number;
  realPercentage: number;
  delayedPercentage: number;
  isOver: boolean;
  isWarning: boolean;
  dailyPaceAverage: number;
  dailySpentAverage: number;
  dailyTotalAverage: number;
  daysActive: number;
}

/**
 * Calcula cuánto se gastó por categoría vs el presupuesto asignado del ciclo/mes.
 * Solo gastos de tipo 'real', no incluye delayed.
 */
export function calculateCategorySpending(
  expenses: Expense[],
  budgetsByCategory: Record<CategoryId, number>
): CategorySpending[] {
  const spentMap = new Map<CategoryId, number>();

  for (const exp of expenses) {
    if (exp.type !== 'real') continue;
    spentMap.set(exp.categoryId, (spentMap.get(exp.categoryId) ?? 0) + exp.amount);
  }

  const allCategoryIds = new Set<CategoryId>([
    ...Array.from(spentMap.keys()),
    ...(Object.keys(budgetsByCategory) as CategoryId[]),
  ]);

  return Array.from(allCategoryIds).map((categoryId) => {
    const spent = spentMap.get(categoryId) ?? 0;
    const budget = budgetsByCategory[categoryId] ?? 0;
    const hasBudget = budget > 0;
    const percentage = hasBudget ? (spent / budget) * 100 : 0;
    return {
      categoryId,
      spent,
      budget,
      hasBudget,
      percentage,
      isOver: hasBudget && spent > budget,
      isWarning: hasBudget && percentage >= 80 && spent <= budget,
    };
  });
}

/**
 * Devuelve el rango de fecha de la semana actual (Lunes a Domingo) en formato YYYY-MM-DD.
 */
/**
 * Calcula cuánto se gastó en una categoría específica en la lista de gastos dada.
 */
export function getSpentForCategory(expenses: Expense[], categoryId: CategoryId): number {
  return expenses
    .filter((e) => e.type === 'real' && e.categoryId === categoryId)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCurrentWeekRange(today: Date = new Date()): { start: string; end: string } {
  const d = new Date(today);
  const day = d.getDay();
  // Domingo es 0, lo tratamos como 7 para que el lunes sea 1
  const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split('T')[0]!,
    end: sunday.toISOString().split('T')[0]!,
  };
}

/**
 * Calcula el progreso de gastos de categorías con meta semanal (Lunes a Domingo).
 */
export function calculateCategoryWeeklySpending(
  expenses: Expense[],
  weeklyBudgetsByCategory: Record<CategoryId, number>,
  now: Date = new Date()
): CategoryWeeklySpending[] {
  const { start, end } = getCurrentWeekRange(now);
  const currentDay = now.getDay();
  const daysPassed = currentDay === 0 ? 7 : currentDay;
  const daysRemaining = Math.max(1, 8 - daysPassed);

  const spentMap = new Map<CategoryId, number>();
  for (const exp of expenses) {
    if (exp.type === 'real' && exp.date >= start && exp.date <= end) {
      spentMap.set(exp.categoryId, (spentMap.get(exp.categoryId) ?? 0) + exp.amount);
    }
  }

  const categoryIdsWithBudget = Object.keys(weeklyBudgetsByCategory) as CategoryId[];

  return categoryIdsWithBudget
    .filter((catId) => (weeklyBudgetsByCategory[catId] ?? 0) > 0)
    .map((categoryId) => {
      const spent = spentMap.get(categoryId) ?? 0;
      const weeklyBudget = weeklyBudgetsByCategory[categoryId] ?? 0;
      const remaining = weeklyBudget - spent;
      const percentage = weeklyBudget > 0 ? (spent / weeklyBudget) * 100 : 0;
      const isOver = spent > weeklyBudget;
      const isWarning = percentage >= 80 && !isOver;
      const dailyAllowance = remaining > 0 ? remaining / daysRemaining : 0;

      return {
        categoryId,
        spent,
        weeklyBudget,
        hasBudget: true,
        percentage,
        isOver,
        isWarning,
        remaining,
        daysRemaining,
        dailyAllowance,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Calcula el progreso del gasto real en la semana en curso (Lunes a Domingo).
 */
export function calculateWeeklySpending(
  expenses: Expense[],
  weeklyLimit: number | null,
  now: Date = new Date()
): WeeklySpendingMetrics {
  const { start, end } = getCurrentWeekRange(now);
  const currentDay = now.getDay();
  // Días restantes en la semana (incluyendo hoy)
  const daysPassed = currentDay === 0 ? 7 : currentDay;
  const daysRemaining = Math.max(1, 8 - daysPassed);

  const spentThisWeek = expenses
    .filter((e) => {
      if (e.type !== 'real' || e.date < start || e.date > end) return false;
      const nature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');
      // La meta semanal es para gasto corriente: excluye fijos, eventuales y casa
      return nature === 'daily';
    })
    .reduce((acc, e) => acc + e.amount, 0);

  const limit = weeklyLimit && weeklyLimit > 0 ? weeklyLimit : null;
  const remaining = limit ? limit - spentThisWeek : 0;
  const percentage = limit ? (spentThisWeek / limit) * 100 : 0;
  const isOver = limit !== null && spentThisWeek > limit;
  const isWarning = limit !== null && percentage >= 80 && !isOver;
  const dailyAllowance = limit && remaining > 0 ? remaining / daysRemaining : 0;

  return {
    spentThisWeek,
    weeklyLimit: limit,
    remaining,
    percentage,
    isOver,
    isWarning,
    daysRemaining,
    dailyAllowance,
    startDateStr: start,
    endDateStr: end,
  };
}

/**
 * Calcula el progreso de gasto del ciclo o período activo vs su presupuesto asignado.
 * Incluye el DelaySpend del período, restándolo del disponible y calculando promedios real y total.
 */
export function calculatePeriodGoalProgress(
  expenses: Expense[],
  period: Period | null,
  now: Date = new Date()
): PeriodGoalMetrics | null {
  if (!period || period.initialIncome <= 0) return null;

  const periodExpenses = expenses.filter((e) => {
    if (e.periodId) return e.periodId === period.id;
    if (e.date < period.startDate) return false;
    if (period.endDate && e.date > period.endDate) return false;
    return true;
  });

  let spent = 0;
  let spentDaily = 0;
  let spentFixed = 0;
  let spentEventual = 0;
  let spentHouse = 0;
  let delayed = 0;
  let extraIncome = 0;

  for (const e of periodExpenses) {
    if (e.type === 'real') {
      spent += e.amount;
      const nature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');
      if (nature === 'fixed') {
        spentFixed += e.amount;
      } else if (nature === 'eventual') {
        spentEventual += e.amount;
      } else if (nature === 'house') {
        spentHouse += e.amount;
      } else {
        spentDaily += e.amount;
      }

      if (e.savedExtraAmount && e.savedExtraAmount > 0) {
        delayed += e.savedExtraAmount;
      }
    } else if (e.type === 'delayed') {
      delayed += e.amount;
    } else if (e.type === 'income') {
      extraIncome += e.amount;
    }
  }

  const baseIncome = period.initialIncome;
  const income = baseIncome + extraIncome;
  const totalAccounted = spent + delayed;
  // Resta tanto el gasto real como el delay spend del saldo disponible
  const remaining = income - totalAccounted;
  const percentage = income > 0 ? (totalAccounted / income) * 100 : 0;
  const realPercentage = income > 0 ? (spent / income) * 100 : 0;
  const delayedPercentage = income > 0 ? (delayed / income) * 100 : 0;
  const isOver = totalAccounted > income;
  const isWarning = percentage >= 80 && !isOver;

  // Días activos desde startDate
  const start = new Date(`${period.startDate}T00:00:00`);
  const current = period.endDate ? new Date(`${period.endDate}T00:00:00`) : now;
  const diffTime = Math.max(0, current.getTime() - start.getTime());
  const daysActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const dailyPaceAverage = spentDaily / daysActive;
  const dailySpentAverage = spent / daysActive;
  const dailyTotalAverage = totalAccounted / daysActive;

  return {
    spent,
    spentDaily,
    spentFixed,
    spentEventual,
    spentHouse,
    delayed,
    totalAccounted,
    income,
    baseIncome,
    extraIncome,
    remaining,
    percentage,
    realPercentage,
    delayedPercentage,
    isOver,
    isWarning,
    dailyPaceAverage,
    dailySpentAverage,
    dailyTotalAverage,
    daysActive,
  };
}
