import { Expense, CategoryId } from '../store/types';

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

