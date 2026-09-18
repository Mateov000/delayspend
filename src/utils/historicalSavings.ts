import { Expense, Period } from '../store/types';
import { isExpenseInPeriod } from './date';

export interface HistoricalSavings {
  /** Ahorro generado por postergación DelaySpend en períodos cerrados (delayed + savedExtraAmount) */
  delaySpendSavings: number;
  /** Dinero no gastado del presupuesto/ingresos asignados en períodos cerrados */
  incomeLeftoverSavings: number;
  /** Suma total de ambos componentes de ahorro en períodos cerrados */
  totalSavings: number;
  /** Cantidad de períodos cerrados auditados */
  closedPeriodsCount: number;
}

/**
 * Calcula el ahorro histórico acumulado considerando EXCLUSIVAMENTE los períodos ya cerrados (endDate !== null):
 * 1. delaySpendSavings: compras postergadas + ahorros por alternativas más baratas dentro de períodos cerrados.
 * 2. incomeLeftoverSavings: sobrante de ingresos efectivos menos gastos reales en períodos cerrados.
 */
export function calculateHistoricalSavings(
  expenses: Expense[],
  periods: Period[]
): HistoricalSavings {
  const closedPeriods = periods.filter((p) => p.endDate !== null && !p.deletedAt);

  if (closedPeriods.length === 0) {
    return {
      delaySpendSavings: 0,
      incomeLeftoverSavings: 0,
      totalSavings: 0,
      closedPeriodsCount: 0,
    };
  }

  let delaySpendSavings = 0;
  let incomeLeftoverSavings = 0;

  for (const period of closedPeriods) {
    const periodExpenses = expenses.filter((e) => isExpenseInPeriod(e, period));

    let periodReal = 0;
    let periodDelayed = 0;
    let periodExtraIncome = 0;

    for (const exp of periodExpenses) {
      if (exp.type === 'real') {
        periodReal += exp.amount;
        if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
          periodDelayed += exp.savedExtraAmount;
        }
      } else if (exp.type === 'delayed') {
        periodDelayed += exp.amount;
      } else if (exp.type === 'income') {
        periodExtraIncome += exp.amount;
      }
    }

    // Ahorro DelaySpend del ciclo cerrado
    delaySpendSavings += periodDelayed;

    // Sobrante de presupuesto/ingresos del ciclo cerrado
    const effectiveIncome = (period.initialIncome || 0) + periodExtraIncome;
    if (effectiveIncome > 0) {
      const leftover = Math.max(0, effectiveIncome - periodReal);
      incomeLeftoverSavings += leftover;
    }
  }

  const roundedDelay = Math.round(delaySpendSavings * 100) / 100;
  const roundedLeftover = Math.round(incomeLeftoverSavings * 100) / 100;
  const roundedTotal = Math.round((roundedDelay + roundedLeftover) * 100) / 100;

  return {
    delaySpendSavings: roundedDelay,
    incomeLeftoverSavings: roundedLeftover,
    totalSavings: roundedTotal,
    closedPeriodsCount: closedPeriods.length,
  };
}
