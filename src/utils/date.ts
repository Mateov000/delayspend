import { Expense, Period, PeriodFilterState } from '../store/types';
import { formatDisplayDate } from './format';

type PeriodsProvider = () => Period[];
let periodsProvider: PeriodsProvider | null = null;

export function registerPeriodsProvider(provider: PeriodsProvider) {
  periodsProvider = provider;
}

export function getRegisteredPeriods(): Period[] {
  return periodsProvider ? periodsProvider() : [];
}

export function isWithinPeriod(
  dateStr: string,
  filter: PeriodFilterState,
  period?: Period | null
): boolean {
  if (filter.type === 'all') return true;

  if (filter.type === 'custom_period' && period) {
    if (dateStr < period.startDate) return false;
    if (period.endDate && dateStr > period.endDate) return false;
    return true;
  }

  const parts = dateStr.split('-');
  const expYear = parseInt(parts[0] ?? '0', 10);
  const expMonth = parseInt(parts[1] ?? '0', 10) - 1; // 0-indexed

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (filter.type === 'current_month') {
    return expYear === currentYear && expMonth === currentMonth;
  }

  if (filter.type === 'previous_month') {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return expYear === prevYear && expMonth === prevMonth;
  }

  return true;
}

export function isExpenseMatchingFilter(
  expense: Expense,
  filter: PeriodFilterState,
  period?: Period | null,
  allPeriods?: Period[]
): boolean {
  if (filter.type === 'all') return true;

  if (filter.type === 'custom_period' && period) {
    return isExpenseInPeriod(expense, period, allPeriods);
  }

  return isWithinPeriod(expense.date, filter, period);
}

/**
 * Encuentra el período al que cronológicamente pertenece una fecha.
 * Si la fecha cae en el límite compartido entre dos períodos (ej. fecha de corte),
 * se prioriza el preferredPeriodId si coincide con alguno de ellos; de lo contrario
 * se prioriza el período más reciente / abierto.
 */
export function findPeriodForDate(
  date: string,
  periods: Period[],
  preferredPeriodId?: string | null
): Period | null {
  const activePeriods = periods.filter((p) => !p.deletedAt);
  if (activePeriods.length === 0) return null;

  // Filtrar períodos cuyo rango de fechas [startDate, endDate] contenga la fecha del gasto
  const matchingPeriods = activePeriods.filter((p) => {
    if (date < p.startDate) return false;
    if (p.endDate && date > p.endDate) return false;
    return true;
  });

  if (matchingPeriods.length === 0) {
    return null;
  }

  if (matchingPeriods.length === 1) {
    return matchingPeriods[0]!;
  }

  // Si hay más de un período que contiene la fecha (ej. día de corte compartido):
  if (preferredPeriodId) {
    const preferred = matchingPeriods.find((p) => p.id === preferredPeriodId);
    if (preferred) return preferred;
  }

  // Por defecto, preferir el período abierto (endDate === null) o el de startDate más reciente
  const openPeriod = matchingPeriods.find((p) => p.endDate === null);
  if (openPeriod) return openPeriod;

  return [...matchingPeriods].sort((a, b) => {
    const diff = b.startDate.localeCompare(a.startDate);
    if (diff !== 0) return diff;
    return b.createdAt.localeCompare(a.createdAt);
  })[0]!;
}

/**
 * Verifica si un gasto pertenece directamente a un período específico.
 * Valida primero que la fecha del gasto esté dentro de los límites del ciclo,
 * y luego comprueba periodId si está presente.
 * Si el periodId apunta a otro período que NO cubre la fecha del gasto, se considera
 * un desfasaje/error y este período (cuyos límites sí cubren el gasto) lo acepta.
 */
export function isExpenseInPeriod(
  expense: Expense,
  period: Period,
  allPeriods?: Period[]
): boolean {
  if (period.deletedAt) return false;

  // Si la fecha del gasto está fuera de los límites cronológicos del período, no pertenece a él
  if (expense.date < period.startDate) return false;
  if (period.endDate && expense.date > period.endDate) return false;

  // Si cae dentro del rango de fechas del período:
  if (expense.periodId) {
    if (expense.periodId === period.id) {
      return true;
    }

    // Si tiene asignado otro período, verificamos si ese otro período es válido y activo para esta fecha.
    // Solo si el otro período existe y realmente cubre la fecha (ej. día de corte exacto donde dos períodos
    // se tocan), respetamos la asignación del otro período y excluimos el gasto de este.
    const periodsList =
      allPeriods ?? (periodsProvider ? periodsProvider() : []);
    const assignedPeriod = periodsList.find((p) => p.id === expense.periodId && !p.deletedAt);
    if (assignedPeriod) {
      const isAssignedValidForDate =
        expense.date >= assignedPeriod.startDate &&
        (!assignedPeriod.endDate || expense.date <= assignedPeriod.endDate);
      if (isAssignedValidForDate) {
        return false;
      }
    }

    // Si el assignedPeriod no cubre la fecha o ya no existe, el periodId estaba desfasado:
    // aceptamos el gasto en este período que sí contiene cronológicamente la fecha.
    return true;
  }

  return true;
}

export interface ExpenseGroup {
  date: string;
  displayDate: string;
  items: Expense[];
  subtotalReal: number;
  subtotalDelayed: number;
  subtotalIncome: number;
}

export function groupExpensesByDate(expenses: Expense[]): ExpenseGroup[] {
  // Ordenar descendentemente por fecha y luego createdAt
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const groupsMap = new Map<string, Expense[]>();

  for (const expense of sorted) {
    const group = groupsMap.get(expense.date);
    if (group) {
      group.push(expense);
    } else {
      groupsMap.set(expense.date, [expense]);
    }
  }

  const result: ExpenseGroup[] = [];

  for (const [date, items] of groupsMap.entries()) {
    let subtotalReal = 0;
    let subtotalDelayed = 0;
    let subtotalIncome = 0;

    for (const item of items) {
      if (item.type === 'real') {
        if (!item.isFictitious) {
          subtotalReal += item.amount;
        }
        if (item.savedExtraAmount && item.savedExtraAmount > 0) {
          subtotalDelayed += item.savedExtraAmount;
        }
      } else if (item.type === 'delayed') {
        subtotalDelayed += item.amount;
      } else if (item.type === 'income') {
        if (!item.isFictitious) {
          subtotalIncome += item.amount;
        }
      }
    }

    result.push({
      date,
      displayDate: formatDisplayDate(date),
      items,
      subtotalReal,
      subtotalDelayed,
      subtotalIncome,
    });
  }

  return result;
}

