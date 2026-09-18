import { Expense, Period, PeriodFilterState, FinancialMetrics } from '../store/types';
import { isExpenseMatchingFilter } from './date';

export function calculateMetrics(
  expenses: Expense[],
  filter: PeriodFilterState,
  period?: Period | null,
  periods?: Period[]
): FinancialMetrics {
  const filtered = expenses.filter(
    (expense) => !expense.isFictitious && isExpenseMatchingFilter(expense, filter, period)
  );

  let totalReal = 0;
  let totalDelayed = 0;
  let pendingTransfer = 0;
  let totalTransferred = 0;
  let extraIncome = 0;

  for (const exp of filtered) {
    if (exp.type === 'real') {
      totalReal += exp.amount;
      // El ahorro de la opción más barata es parte del ahorro protegido (delay)
      if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
        totalDelayed += exp.savedExtraAmount;
        if (exp.transferredAt === null) {
          pendingTransfer += exp.savedExtraAmount;
        } else {
          totalTransferred += exp.savedExtraAmount;
        }
      }
    } else if (exp.type === 'delayed') {
      totalDelayed += exp.amount;
      if (exp.transferredAt === null) {
        pendingTransfer += exp.amount;
      } else {
        totalTransferred += exp.amount;
      }
    } else if (exp.type === 'income') {
      extraIncome += exp.amount;
    }
  }

  let baseIncome = 0;
  if (period) {
    baseIncome = period.initialIncome;
  } else if (filter.type === 'all' && periods && periods.length > 0) {
    baseIncome = periods
      .filter((p) => !p.deletedAt)
      .reduce((sum, p) => sum + (p.initialIncome || 0), 0);
  }
  const totalIncome = baseIncome + extraIncome;
  const totalAccounted = totalReal + totalDelayed;
  const remainingBalance = totalIncome - totalAccounted;
  const freeBalance = totalIncome - totalAccounted;
  const delayRatePercentage =
    totalAccounted > 0 ? Math.round((totalDelayed / totalAccounted) * 100) : 0;

  return {
    totalReal,
    totalDelayed,
    pendingTransfer,
    totalTransferred,
    totalAccounted,
    delayRatePercentage,
    initialIncome: totalIncome,
    baseIncome,
    extraIncome,
    remainingBalance,
    freeBalance,
  };
}
