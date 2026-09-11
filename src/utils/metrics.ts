import { Expense, PeriodFilterState, FinancialMetrics } from '../store/types';
import { isWithinPeriod } from './date';

export function calculateMetrics(
  expenses: Expense[],
  filter: PeriodFilterState
): FinancialMetrics {
  const filtered = expenses.filter((expense) => isWithinPeriod(expense.date, filter));

  let totalReal = 0;
  let totalDelayed = 0;
  let pendingTransfer = 0;
  let totalTransferred = 0;

  for (const exp of filtered) {
    if (exp.type === 'real') {
      totalReal += exp.amount;
    } else if (exp.type === 'delayed') {
      totalDelayed += exp.amount;
      if (exp.transferredAt === null) {
        pendingTransfer += exp.amount;
      } else {
        totalTransferred += exp.amount;
      }
    }
  }

  const totalAccounted = totalReal + totalDelayed;
  const delayRatePercentage =
    totalAccounted > 0 ? Math.round((totalDelayed / totalAccounted) * 100) : 0;

  return {
    totalReal,
    totalDelayed,
    pendingTransfer,
    totalTransferred,
    totalAccounted,
    delayRatePercentage,
  };
}

