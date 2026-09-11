import { Expense, FinancialMetrics, PeriodFilterState } from '../store/types';
import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatDayMonth } from './format';
import { STRINGS } from '../constants/strings';
import { isWithinPeriod } from './date';

function getPeriodLabel(filter: PeriodFilterState): string {
  const now = new Date();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (filter.type === 'current_month') {
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  if (filter.type === 'previous_month') {
    const prevMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `${monthNames[prevMonthIdx]} ${prevYear}`;
  }

  return 'Historial Completo';
}

export function generateWhatsAppReport(
  expenses: Expense[],
  filter: PeriodFilterState,
  metrics: FinancialMetrics
): string {
  const filtered = expenses.filter((e) => isWithinPeriod(e.date, filter));

  const realExpenses = filtered.filter((e) => e.type === 'real');
  const delayedExpenses = filtered.filter((e) => e.type === 'delayed');

  const lines: string[] = [];

  lines.push(STRINGS.EXPORT_WHATSAPP_HEADER);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PERIOD} ${getPeriodLabel(filter)}`);
  lines.push('');

  // Sección de Gastos Reales
  lines.push(STRINGS.EXPORT_WHATSAPP_REAL_SECTION);
  if (realExpenses.length === 0) {
    lines.push('_(Sin gastos registrados en el período)_');
  } else {
    for (const exp of realExpenses) {
      const cat = getCategoryById(exp.categoryId);
      lines.push(
        `• ${formatDayMonth(exp.date)}: ${exp.description} - ${formatCurrency(exp.amount)} [${cat.name}]`
      );
    }
  }
  lines.push('');

  // Sección de Gastos Delayeados
  lines.push(STRINGS.EXPORT_WHATSAPP_DELAYED_SECTION);
  if (delayedExpenses.length === 0) {
    lines.push('_(Sin compras delayeadas registradas)_');
  } else {
    for (const exp of delayedExpenses) {
      const cat = getCategoryById(exp.categoryId);
      const statusText = exp.transferredAt ? '(Ya transferido ✅)' : '(Pendiente transferir ⏳)';
      lines.push(
        `• ${formatDayMonth(exp.date)}: ${exp.description} - ${formatCurrency(exp.amount)} [${cat.name}] ${statusText}`
      );
    }
  }
  lines.push('');

  // Sección de Resumen Financiero
  lines.push(STRINGS.EXPORT_WHATSAPP_SUMMARY_SECTION);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_REAL} ${formatCurrency(metrics.totalReal)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_DELAYED} ${formatCurrency(metrics.totalDelayed)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PENDING_TRANSFER} ${formatCurrency(metrics.pendingTransfer)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_BUDGET} ${formatCurrency(metrics.totalAccounted)}`);
  lines.push('');
  lines.push(STRINGS.EXPORT_WHATSAPP_FOOTER);

  return lines.join('\n');
}

export function downloadExpensesCSV(
  expenses: Expense[],
  filter: PeriodFilterState
): void {
  const filtered = expenses.filter((e) => isWithinPeriod(e.date, filter));

  const headers = [
    'Fecha',
    'Tipo',
    'Monto',
    'Categoría',
    'Concepto / Detalle',
    'Estado de Transferencia',
    'Fecha de Transferencia',
  ];

  const escapeCSV = (field: string | number) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = filtered.map((exp) => {
    const cat = getCategoryById(exp.categoryId);
    const tipo = exp.type === 'real' ? 'Gasto Real' : 'Compra Delayeada';
    let transferStatus = 'No aplica';
    if (exp.type === 'delayed') {
      transferStatus = exp.transferredAt ? 'Transferido' : 'Pendiente de transferir';
    }

    return [
      exp.date,
      tipo,
      exp.amount.toFixed(2),
      cat.name,
      exp.description,
      transferStatus,
      exp.transferredAt ? exp.transferredAt.split('T')[0] : '',
    ]
      .map((item) => escapeCSV(item ?? ''))
      .join(',');
  });

  // UTF-8 BOM obligatorio para compatibilidad total con Microsoft Excel en Windows
  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `delayspend_rendicion_${filter.type}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

