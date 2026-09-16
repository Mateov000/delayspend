import { Expense, Period } from '../store/types';
import { isExpenseInPeriod } from './date';

export interface HistoricalSavings {
  /** Ahorro generado por postergación DelaySpend (delayed + savedExtraAmount en todas las compras) */
  delaySpendSavings: number;
  /** Dinero no gastado del ingreso inicial en períodos anteriores que ya fueron cerrados (endDate !== null) */
  incomeLeftoverSavings: number;
  /** Suma total de ambos componentes de ahorro */
  totalSavings: number;
  /** Cantidad de períodos cerrados con sobrante de dinero */
  closedPeriodsCount: number;
}

/**
 * Calcula el ahorro histórico acumulado total del usuario:
 * 1. delaySpendSavings: suma de TODO lo delayeado + sobreprecios evitados, sin filtrar por período.
 * 2. incomeLeftoverSavings: suma de (initialIncome + extraIncomes - totalReal) de todos los períodos ya cerrados.
 */
export function calculateHistoricalSavings(
  expenses: Expense[],
  periods: Period[]
): HistoricalSavings {
  // 1. Ahorro DelaySpend total acumulado
  let delaySpendSavings = 0;
  for (const exp of expenses) {
    if (exp.type === 'delayed') {
      delaySpendSavings += exp.amount;
    } else if (exp.type === 'real' && exp.savedExtraAmount && exp.savedExtraAmount > 0) {
      delaySpendSavings += exp.savedExtraAmount;
    }
  }

  // 2. Sobrante de ingresos en períodos ya cerrados
  let incomeLeftoverSavings = 0;
  let closedPeriodsCount = 0;

  const closedPeriods = periods.filter((p) => p.endDate !== null && !p.deletedAt);

  for (const period of closedPeriods) {
    const periodExpenses = expenses.filter((e) => isExpenseInPeriod(e, period));

    let periodReal = 0;
    let periodExtraIncome = 0;
    for (const exp of periodExpenses) {
      if (exp.type === 'real') {
        periodReal += exp.amount;
      } else if (exp.type === 'income') {
        periodExtraIncome += exp.amount;
      }
    }

    const effectiveIncome = (period.initialIncome || 0) + periodExtraIncome;
    if (effectiveIncome > 0) {
      const leftover = Math.max(0, effectiveIncome - periodReal);
      incomeLeftoverSavings += leftover;
      closedPeriodsCount++;
    }
  }

  return {
    delaySpendSavings: Math.round(delaySpendSavings * 100) / 100,
    incomeLeftoverSavings: Math.round(incomeLeftoverSavings * 100) / 100,
    totalSavings: Math.round((delaySpendSavings + incomeLeftoverSavings) * 100) / 100,
    closedPeriodsCount,
  };
}
