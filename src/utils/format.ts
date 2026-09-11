import { STRINGS } from '../constants/strings';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '$ 0,00';
  return currencyFormatter.format(amount);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) {
    return STRINGS.HISTORY_TODAY;
  }
  if (dateStr === yesterdayStr) {
    return STRINGS.HISTORY_YESTERDAY;
  }

  const parts = dateStr.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (parts.length === 3 && year && month && day) {
    return `${day}/${month}/${year}`;
  }

  return dateStr;
}

export function formatDayMonth(dateStr: string): string {
  const parts = dateStr.split('-');
  const month = parts[1];
  const day = parts[2];
  if (parts.length >= 3 && day && month) {
    return `${day}/${month}`;
  }
  return dateStr;
}

