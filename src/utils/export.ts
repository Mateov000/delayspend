import { Expense, FinancialMetrics, Period, PeriodFilterState, ExpenseNature } from '../store/types';
import { findCategoryById, useCategoryStore } from '../store/useCategoryStore';
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
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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

export interface ParentExportConfig {
  showCategory?: boolean;
  showNature?: boolean;
  includedNatures?: Record<ExpenseNature, boolean>;
  summaryMode?: 'full' | 'total_only';
}

export interface ExportOptions extends ParentExportConfig {
  unified?: boolean;
  period?: Period | null;
  maskedCategoryIds?: string[];
}

export function generateWhatsAppReport(
  expenses: Expense[],
  filter: PeriodFilterState,
  metrics: FinancialMetrics,
  options?: ExportOptions
): string {
  const unified = options?.unified ?? false;
  const period = options?.period ?? null;
  const filtered = expenses
    .filter((e) => !e.linkedExpenseId)
    .filter((e) => isExpenseMatchingFilter(e, filter, period));

  const lines: string[] = [];

  lines.push(STRINGS.EXPORT_WHATSAPP_HEADER);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PERIOD} ${getPeriodLabel(filter, period)}`);
  lines.push('');

  if (unified) {
    // Modo Unificado (Reporte para padres):
    const showCat = options?.showCategory ?? true;
    const showNat = options?.showNature ?? true;
    const summaryMode = options?.summaryMode ?? 'full';

    lines.push(STRINGS.EXPORT_WHATSAPP_UNIFIED_SECTION);

    if (filtered.length === 0) {
      lines.push('_(Sin gastos registrados en el período)_');
    } else {
      const maskedIds = options?.maskedCategoryIds ?? useCategoryStore.getState().parentMaskedCategoryIds;
      const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
      for (const exp of sorted) {
        const cat = findCategoryById(exp.categoryId);
        const isMasked = unified && maskedIds.includes(exp.categoryId);
        const catName = isMasked ? 'Otros Gastos' : cat.name;
        const totalAmount =
          exp.type === 'real'
            ? exp.amount + (exp.savedExtraAmount || 0)
            : exp.amount;

        const catTag = showCat ? ` [${catName}]` : '';
        let natureTag = '';
        if (showNat) {
          const nat = exp.nature ?? (exp.isRecurring ? 'fixed' : 'daily');
          const isNatureIncluded = options?.includedNatures
            ? (options.includedNatures[nat] ?? true)
            : true;
          if (isNatureIncluded) {
            if (nat === 'house') natureTag = ' 🏠 [Para la casa]';
            else if (nat === 'fixed') natureTag = ' 🔄 [Fijo]';
            else if (nat === 'eventual') natureTag = ' ⚡ [Eventual]';
            else if (nat === 'daily') natureTag = ' 🛒 [Cotidiano]';
          }
        }

        lines.push(
          `• ${formatDayMonth(exp.date)}: ${exp.description} - ${formatCurrency(totalAmount)}${catTag}${natureTag}`
        );
      }
    }
    lines.push('');

    // Resumen Financiero Unificado
    const totalUnifiedAmount = filtered.reduce(
      (sum, e) => sum + (e.type === 'real' ? e.amount + (e.savedExtraAmount || 0) : e.amount),
      0
    );

    if (summaryMode === 'total_only') {
      lines.push('📈 *Total:*');
      lines.push(`• Total a rendir: ${formatCurrency(totalUnifiedAmount)}`);
    } else {
      lines.push(STRINGS.EXPORT_WHATSAPP_SUMMARY_SECTION);
      if (metrics.initialIncome > 0) {
        lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(metrics.initialIncome)}`);
      }
      lines.push(`${STRINGS.EXPORT_WHATSAPP_UNIFIED_TOTAL} ${formatCurrency(totalUnifiedAmount)}`);
      if (metrics.initialIncome > 0) {
        const remaining = metrics.initialIncome - totalUnifiedAmount;
        lines.push(`${STRINGS.EXPORT_WHATSAPP_REMAINING} ${formatCurrency(remaining)}`);
      }
      const totalHouseUnified = filtered
        .filter((e) => e.nature === 'house')
        .reduce((sum, e) => sum + (e.type === 'real' ? e.amount + (e.savedExtraAmount || 0) : e.amount), 0);
      if (totalHouseUnified > 0) {
        lines.push(`🏠 Total destinado a la casa: ${formatCurrency(totalHouseUnified)}`);
      }
    }

    if (STRINGS.EXPORT_WHATSAPP_FOOTER) {
      lines.push('');
      lines.push(STRINGS.EXPORT_WHATSAPP_FOOTER);
    }

    return lines.join('\n');
  }

  // Modo Detallado: distingue gastos reales de compras postergadas
  const realExpenses = filtered.filter((e) => e.type === 'real');
  const delayedExpenses = filtered.filter((e) => e.type === 'delayed');

  // Sección de Gastos Reales
  lines.push(STRINGS.EXPORT_WHATSAPP_REAL_SECTION);
  if (realExpenses.length === 0) {
    lines.push('_(Sin gastos registrados en el período)_');
  } else {
    for (const exp of realExpenses) {
      const cat = findCategoryById(exp.categoryId);
      const savingsInfo =
        exp.savedExtraAmount && exp.savedExtraAmount > 0
          ? ` (Ahorro opción barata: +${formatCurrency(exp.savedExtraAmount)})`
          : '';
      const houseTag = exp.nature === 'house' ? ' 🏠 [Para la casa]' : '';
      lines.push(
        `• ${formatDayMonth(exp.date)}: ${exp.description} - ${formatCurrency(exp.amount)} [${cat.name}]${houseTag}${savingsInfo}`
      );
    }
  }
  lines.push('');

  // Sección de Gastos Postergados
  lines.push(STRINGS.EXPORT_WHATSAPP_DELAYED_SECTION);
  if (delayedExpenses.length === 0) {
    lines.push('_(Sin compras postergadas registradas)_');
  } else {
    for (const exp of delayedExpenses) {
      const cat = findCategoryById(exp.categoryId);
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

  const totalHouseDetailed = filtered
    .filter((e) => e.nature === 'house')
    .reduce((sum, e) => sum + e.amount, 0);
  if (totalHouseDetailed > 0) {
    lines.push(`🏠 Total destinado a la casa: ${formatCurrency(totalHouseDetailed)}`);
  }

  if (STRINGS.EXPORT_WHATSAPP_FOOTER) {
    lines.push('');
    lines.push(STRINGS.EXPORT_WHATSAPP_FOOTER);
  }

  return lines.join('\n');
}

export function downloadExpensesCSV(
  expenses: Expense[],
  filter: PeriodFilterState,
  options?: ExportOptions
): void {
  const unified = options?.unified ?? false;
  const period = options?.period ?? null;
  const filtered = expenses
    .filter((e) => !e.linkedExpenseId)
    .filter((e) => isExpenseMatchingFilter(e, filter, period));

  const escapeCSV = (field: string | number) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = unified
    ? ['Fecha', 'Monto', 'Categoría', 'Concepto / Detalle', 'Para la Casa']
    : [
        'Fecha',
        'Tipo',
        'Monto',
        'Categoría',
        'Concepto / Detalle',
        'Para la Casa',
        'Estado de Transferencia',
        'Fecha de Transferencia',
      ];

  const maskedIds = options?.maskedCategoryIds ?? useCategoryStore.getState().parentMaskedCategoryIds;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const rows = sorted.map((exp) => {
    const cat = findCategoryById(exp.categoryId);
    const isMasked = unified && maskedIds.includes(exp.categoryId);
    const catName = isMasked ? 'Otros Gastos' : cat.name;

    if (unified) {
      const totalAmount =
        exp.type === 'real'
          ? exp.amount + (exp.savedExtraAmount || 0)
          : exp.amount;

      return [
        exp.date,
        totalAmount.toFixed(2),
        options?.showCategory === false ? '' : catName,
        exp.description,
        exp.nature === 'house' ? 'Sí' : 'No',
      ]
        .map((item) => escapeCSV(item ?? ''))
        .join(',');
    }

    const tipo = exp.type === 'real' ? 'Gasto Real' : 'Compra Postergada';
    let transferStatus = 'No aplica';
    if (exp.type === 'delayed') {
      transferStatus = exp.transferredAt ? 'Transferido' : 'Pendiente de transferir';
    } else if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
      transferStatus = exp.transferredAt ? 'Ahorro transferido' : 'Ahorro pendiente';
    }

    return [
      exp.date,
      tipo,
      exp.amount.toFixed(2),
      cat.name,
      exp.description,
      exp.nature === 'house' ? 'Sí' : 'No',
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
  const filenameSuffix = unified ? 'unificado' : 'detallado';
  const periodSlug = period ? period.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : filter.type;
  link.setAttribute('href', url);
  link.setAttribute('download', `rendicion_${periodSlug}_${filenameSuffix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
