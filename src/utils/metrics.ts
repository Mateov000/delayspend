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
    }
  }

  const initialIncome = period ? period.initialIncome : 0;
  const totalAccounted = totalReal + totalDelayed;
  const remainingBalance = initialIncome - totalAccounted;
  const freeBalance = initialIncome - totalAccounted;
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

