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
  income: number;
  remaining: number;
  percentage: number;
  isOver: boolean;
  isWarning: boolean;
  dailySpentAverage: number;
  daysActive: number;
}

/**
 * Calcula cuánto se gastó por categoría vs el presupuesto asignado.
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
 * Calcula cuánto se gastó en una categoría específica en la lista de gastos dada.
 */
export function getSpentForCategory(expenses: Expense[], categoryId: CategoryId): number {
  return expenses
    .filter((e) => e.type === 'real' && e.categoryId === categoryId)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Devuelve el rango de fecha de la semana actual (Lunes a Domingo) en formato YYYY-MM-DD.
 */
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
    .filter((e) => e.type === 'real' && e.date >= start && e.date <= end)
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
 * Calcula el progreso de gasto del ciclo o período activo vs su initialIncome.
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

  const spent = periodExpenses
    .filter((e) => e.type === 'real')
    .reduce((acc, e) => acc + e.amount, 0);

  const income = period.initialIncome;
  const remaining = income - spent;
  const percentage = (spent / income) * 100;
  const isOver = spent > income;
  const isWarning = percentage >= 80 && !isOver;

  // Días activos desde startDate
  const start = new Date(`${period.startDate}T00:00:00`);
  const current = period.endDate ? new Date(`${period.endDate}T00:00:00`) : now;
  const diffTime = Math.max(0, current.getTime() - start.getTime());
  const daysActive = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const dailySpentAverage = spent / daysActive;

  return {
    spent,
    income,
    remaining,
    percentage,
    isOver,
    isWarning,
    dailySpentAverage,
    daysActive,
  };
}
