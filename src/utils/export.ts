import { Expense, FinancialMetrics, Period, PeriodFilterState } from '../store/types';
import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatDayMonth } from './format';
import { STRINGS } from '../constants/strings';
import { isExpenseMatchingFilter } from './date';

function getPeriodLabel(filter: PeriodFilterState, period?: Period | null): string {
  if (filter.type === 'custom_period' && period) {
    const endStr = period.endDate ? formatDayMonth(period.endDate) : 'Presente';
    return `${period.name} (${formatDayMonth(period.startDate)} al ${endStr})`;
  }

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

export interface ExportOptions {
  unified?: boolean;
  period?: Period | null;
}

export interface UnifiedReportItem {
  id: string;
  date: string;
  amount: number;
  categoryId: Expense['categoryId'];
  description: string;
}

/**
 * Genera la lista para el reporte de padres (modo unificado):
 * Para los gastos donde se eligió una opción más barata, suma el gasto real + el delayeado ahorrado
 * de modo que aparezca simplemente como un único gasto con el valor total (contando gasto y delay).
 * Los registros complementarios de delay generados automáticamente se omiten para evitar duplicación.
 */
export function getUnifiedExpensesForReport(expenses: Expense[]): UnifiedReportItem[] {
  const companionIds = new Set<string>();
  for (const exp of expenses) {
    if (exp.linkedExpenseId) {
      companionIds.add(exp.id);
    }
  }

  const items: UnifiedReportItem[] = [];

  for (const exp of expenses) {
    // Si es un registro complementario vinculado a un gasto real, se omite
    if (companionIds.has(exp.id)) {
      continue;
    }

    if (exp.type === 'real') {
      // Contar gasto real y delay: exp.amount + (exp.savedExtraAmount || 0)
      const totalAmount = exp.amount + (exp.savedExtraAmount || 0);
      items.push({
        id: exp.id,
        date: exp.date,
        amount: Math.round(totalAmount * 100) / 100,
        categoryId: exp.categoryId,
        description: exp.description,
      });
    } else {
      // Compra delayeada regular (standalone)
      items.push({
        id: exp.id,
        date: exp.date,
        amount: exp.amount,
        categoryId: exp.categoryId,
        description: exp.description,
      });
    }
  }

  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateWhatsAppReport(
  expenses: Expense[],
  filter: PeriodFilterState,
  metrics: FinancialMetrics,
  options?: ExportOptions
): string {
  const unified = options?.unified ?? false;
  const period = options?.period ?? null;
  const filtered = expenses.filter((e) => isExpenseMatchingFilter(e, filter, period));

  const lines: string[] = [];

  lines.push(STRINGS.EXPORT_WHATSAPP_HEADER);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PERIOD} ${getPeriodLabel(filter, period)}`);
  lines.push('');

  if (unified) {
    // Modo Unificado (Reporte para padres):
    // Aparece simplemente como un gasto más (contando gasto y delay)
    lines.push(STRINGS.EXPORT_WHATSAPP_UNIFIED_SECTION);

    const unifiedList = getUnifiedExpensesForReport(filtered);

    if (unifiedList.length === 0) {
      lines.push('_(Sin gastos registrados en el período)_');
    } else {
      for (const exp of unifiedList) {
        const cat = getCategoryById(exp.categoryId);
        lines.push(
          `• ${formatDayMonth(exp.date)}: ${exp.description} - ${formatCurrency(exp.amount)} [${cat.name}]`
        );
      }
    }
    lines.push('');

    // Resumen Financiero Unificado
    lines.push(STRINGS.EXPORT_WHATSAPP_SUMMARY_SECTION);
    if (metrics.initialIncome > 0) {
      lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(metrics.initialIncome)}`);
    }
    lines.push(`${STRINGS.EXPORT_WHATSAPP_UNIFIED_TOTAL} ${formatCurrency(metrics.totalAccounted)}`);
    if (metrics.initialIncome > 0) {
      lines.push(`${STRINGS.EXPORT_WHATSAPP_REMAINING} ${formatCurrency(metrics.remainingBalance)}`);
    }
    lines.push('');
    lines.push(STRINGS.EXPORT_WHATSAPP_FOOTER);

    return lines.join('\n');
  }

  // Modo Detallado: distingue gastos reales de compras delayeadas
  const realExpenses = filtered.filter((e) => e.type === 'real');
  const delayedExpenses = filtered.filter((e) => e.type === 'delayed');

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
  if (metrics.initialIncome > 0) {
    lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(metrics.initialIncome)}`);
  }
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_REAL} ${formatCurrency(metrics.totalReal)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_DELAYED} ${formatCurrency(metrics.totalDelayed)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PENDING_TRANSFER} ${formatCurrency(metrics.pendingTransfer)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_BUDGET} ${formatCurrency(metrics.totalAccounted)}`);
  if (metrics.initialIncome > 0) {
    lines.push(`${STRINGS.EXPORT_WHATSAPP_REMAINING} ${formatCurrency(metrics.remainingBalance)}`);
  }
  lines.push('');
  lines.push(STRINGS.EXPORT_WHATSAPP_FOOTER);

  return lines.join('\n');
}

export function downloadExpensesCSV(
  expenses: Expense[],
  filter: PeriodFilterState,
  options?: ExportOptions
): void {
  const unified = options?.unified ?? false;
  const period = options?.period ?? null;
  const filtered = expenses.filter((e) => isExpenseMatchingFilter(e, filter, period));

  const escapeCSV = (field: string | number) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = unified
    ? ['Fecha', 'Monto', 'Categoría', 'Concepto / Detalle']
    : [
        'Fecha',
        'Tipo',
        'Monto',
        'Categoría',
        'Concepto / Detalle',
        'Estado de Transferencia',
        'Fecha de Transferencia',
      ];

  let rows: string[] = [];

  if (unified) {
    // Modo Unificado (Reporte para padres):
    // Aparece simplemente como un gasto más (contando gasto y delay)
    const unifiedList = getUnifiedExpensesForReport(filtered);
    rows = unifiedList.map((exp) => {
      const cat = getCategoryById(exp.categoryId);
      return [
        exp.date,
        exp.amount.toFixed(2),
        cat.name,
        exp.description,
      ]
        .map((item) => escapeCSV(item ?? ''))
        .join(',');
    });
  } else {
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    rows = sorted.map((exp) => {
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
  }

  // UTF-8 BOM obligatorio para compatibilidad total con Microsoft Excel en Windows
  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  const filenameSuffix = unified ? 'unificado' : 'detallado';
  const periodSlug = period ? period.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : filter.type;
  link.setAttribute('href', url);
  link.setAttribute('download', `delayspend_rendicion_${periodSlug}_${filenameSuffix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
