import { Expense, Period, PeriodFilterState } from '../store/types';
import { formatDisplayDate } from './format';

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
  period?: Period | null
): boolean {
  if (filter.type === 'all') return true;

  if (filter.type === 'custom_period' && period) {
    if (expense.periodId) {
      return expense.periodId === period.id;
    }
    if (expense.date < period.startDate) return false;
    if (period.endDate && expense.date > period.endDate) return false;
    return true;
  }

  return isWithinPeriod(expense.date, filter, period);
}

export interface ExpenseGroup {
  date: string;
  displayDate: string;
  items: Expense[];
  subtotalReal: number;
  subtotalDelayed: number;
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

    for (const item of items) {
      if (item.type === 'real') {
        subtotalReal += item.amount;
      } else {
        subtotalDelayed += item.amount;
      }
    }

    result.push({
      date,
      displayDate: formatDisplayDate(date),
      items,
      subtotalReal,
      subtotalDelayed,
    });
  }

  return result;
}

