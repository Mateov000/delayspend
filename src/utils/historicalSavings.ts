import { Expense, Period } from '../store/types';
import { isExpenseInPeriod } from './date';

export interface HistoricalSavings {
  /** Suma de todos los montos protegidos (delayed + savedExtraAmount) transferidos o pendientes */
  delaySpendSavings: number;
  /** Suma de sobrantes de ingreso en períodos cerrados (initialIncome - totalAccounted, solo positivos) */
  incomeLeftoverSavings: number;
  /** Total: delaySpendSavings + incomeLeftoverSavings */
  totalSavings: number;
  /** Cantidad de períodos que aportan datos al cálculo */
  periodsCount: number;
}

/**
 * Calcula el ahorro histórico acumulado a través de todos los períodos.
 * - delaySpendSavings: todo lo protegido por DelaySpend (transferido + pendiente)
 * - incomeLeftoverSavings: lo que sobró al cerrar cada período (no gastado ni delayeado)
 */
export function calculateHistoricalSavings(
  expenses: Expense[],
  periods: Period[]
): HistoricalSavings {
  let delaySpendSavings = 0;
  let incomeLeftoverSavings = 0;

  // DelaySpend savings: acumular TODOS los gastos delayed y savedExtraAmount (sin filtrar por período)
  for (const exp of expenses) {
    if (exp.type === 'delayed') {
      delaySpendSavings += exp.amount;
    } else if (exp.type === 'real' && exp.savedExtraAmount && exp.savedExtraAmount > 0) {
      delaySpendSavings += exp.savedExtraAmount;
    }
  }

  // Sobrante de ingreso: solo para períodos CERRADOS con income asignado
  const closedPeriods = periods.filter(
    (p) => p.endDate !== null && p.initialIncome > 0 && !p.deletedAt
  );

  for (const period of closedPeriods) {
    const periodExpenses = expenses.filter((e) => isExpenseInPeriod(e, period));
    let totalReal = 0;
    let totalDelayed = 0;
    for (const exp of periodExpenses) {
      if (exp.type === 'real') {
        totalReal += exp.amount;
        if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
          totalDelayed += exp.savedExtraAmount;
        }
      } else if (exp.type === 'delayed') {
        totalDelayed += exp.amount;
      }
    }
    const totalAccounted = totalReal + totalDelayed;
    const leftover = period.initialIncome - totalAccounted;
    if (leftover > 0) {
      incomeLeftoverSavings += leftover;
    }
  }

  return {
    delaySpendSavings,
    incomeLeftoverSavings,
    totalSavings: delaySpendSavings + incomeLeftoverSavings,
    periodsCount: closedPeriods.length,
  };
}

