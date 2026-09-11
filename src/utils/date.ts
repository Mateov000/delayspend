import { Expense, PeriodFilterState } from '../store/types';
import { formatDisplayDate } from './format';

export function isWithinPeriod(dateStr: string, filter: PeriodFilterState): boolean {
  if (filter.type === 'all') return true;

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

