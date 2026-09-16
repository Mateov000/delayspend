import { Expense, Period, PeriodFilterState, FinancialMetrics } from '../store/types';
import { isExpenseMatchingFilter } from './date';

export function calculateMetrics(
  expenses: Expense[],
  filter: PeriodFilterState,
  period?: Period | null
): FinancialMetrics {
  const filtered = expenses.filter((expense) =>
    isExpenseMatchingFilter(expense, filter, period)
  );

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

  const initialIncome = period ? period.initialIncome : 0;
  const remainingBalance = initialIncome - totalReal;
  const freeBalance = initialIncome - totalReal - pendingTransfer;

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
    initialIncome,
    remainingBalance,
    freeBalance,
  };
}

