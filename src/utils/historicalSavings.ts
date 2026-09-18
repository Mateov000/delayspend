import { Expense, Period } from '../store/types';
import { isExpenseInPeriod } from './date';

export interface HistoricalSavings {
  /** Ahorro acumulado total en períodos cerrados: delaySpendSavings + incomeLeftoverSavings */
  totalSavings: number;
  /** Ahorro total por postergaciones (compras evitadas + sobreprecios evitados) */
  delaySpendSavings: number;
  /** Desglose: compras que ibas a hacer y postergaste (no consumadas directamente) */
  delaySpendDirect: number;
  /** Desglose: ahorro por opción más barata (sobreprecio evitado en gastos reales) */
  delaySpendCheaper: number;
  /** Sobrante neto de ingresos de períodos cerrados: ingresos - gasto real - delayspend (lo que ven los padres) */
  incomeLeftoverSavings: number;
  /** Cantidad de períodos cerrados auditados */
  closedPeriodsCount: number;
}

/**
 * Calcula el ahorro histórico acumulado considerando EXCLUSIVAMENTE los períodos cerrados (endDate !== null):
 * 1. delaySpendSavings: suma de compras postergadas (no consumadas) + ahorros por alternativa más barata.
 * 2. incomeLeftoverSavings: balance neto de ingresos asignados menos gastos reales y delayspend de ciclos concluidos
 *    (ingresos - gasto real - delayspend). Es lo que le hubiera sobrado al usuario si las compras delayspend fueran reales (lo que ven los padres).
 * 3. totalSavings: suma de ambos componentes (delaySpendSavings + incomeLeftoverSavings = ingresos - gasto real).
 */
export function calculateHistoricalSavings(
  expenses: Expense[],
  periods: Period[]
): HistoricalSavings {
  const closedPeriods = periods.filter((p) => p.endDate !== null && !p.deletedAt);

  if (closedPeriods.length === 0) {
    return {
      totalSavings: 0,
      delaySpendSavings: 0,
      delaySpendDirect: 0,
      delaySpendCheaper: 0,
      incomeLeftoverSavings: 0,
      closedPeriodsCount: 0,
    };
  }

  let delaySpendDirect = 0;
  let delaySpendCheaper = 0;
  let incomeLeftoverSavings = 0;

  for (const period of closedPeriods) {
    const periodExpenses = expenses
      .filter((e) => !e.linkedExpenseId && !e.isFictitious)
      .filter((e) => isExpenseInPeriod(e, period));

    let periodReal = 0;
    let periodDirect = 0;
    let periodCheaper = 0;
    let periodExtraIncome = 0;

    for (const exp of periodExpenses) {
      if (exp.type === 'real') {
        periodReal += exp.amount;
        if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
          periodCheaper += exp.savedExtraAmount;
        }
      } else if (exp.type === 'delayed') {
        periodDirect += exp.amount;
      } else if (exp.type === 'income') {
        periodExtraIncome += exp.amount;
      }
    }

    delaySpendDirect += periodDirect;
    delaySpendCheaper += periodCheaper;

    // Total DelaySpend del período (compras postergadas + ahorros por opción más barata)
    const periodDelaySpend = periodDirect + periodCheaper;

    // Sobrante neto de ingresos del ciclo cerrado:
    // Ingresos efectivos - Gasto real - DelaySpend
    // Es lo que le hubiera sobrado si las compras delayspend fueran reales (lo que ven los padres)
    const effectiveIncome = (period.initialIncome || 0) + periodExtraIncome;
    if (effectiveIncome > 0) {
      const leftover = effectiveIncome - periodReal - periodDelaySpend;
      incomeLeftoverSavings += leftover;
    }
  }

  const roundedDirect = Math.round(delaySpendDirect * 100) / 100;
  const roundedCheaper = Math.round(delaySpendCheaper * 100) / 100;
  const roundedDelay = Math.round((roundedDirect + roundedCheaper) * 100) / 100;
  const roundedLeftover = Math.round(incomeLeftoverSavings * 100) / 100;
  const roundedTotal = Math.round((roundedDelay + roundedLeftover) * 100) / 100;

  return {
    totalSavings: roundedTotal,
    delaySpendSavings: roundedDelay,
    delaySpendDirect: roundedDirect,
    delaySpendCheaper: roundedCheaper,
    incomeLeftoverSavings: roundedLeftover,
    closedPeriodsCount: closedPeriods.length,
  };
}
