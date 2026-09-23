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
  showNatureTags?: Record<ExpenseNature, boolean>;
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
    .filter((e) => isExpenseMatchingFilter(e, filter, period))
    .filter((e) => {
      // Regla de privacidad de Vicios y Gastos Ficticios:
      if (unified) {
        // En reporte para padres: NUNCA mostrar Vicios (0% de probabilidad)
        if (e.categoryId === 'vices') return false;
      } else {
        // En exportación personal: los gastos ficticios son máscaras y se excluyen
        if (e.isFictitious) return false;
      }
      if (!options?.includedNatures) return true;
      const nature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');
      return options.includedNatures[nature] ?? true;
    });

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

    const expensesToReport = filtered.filter((e) => e.type !== 'income');
    const extraIncomes = filtered.filter((e) => e.type === 'income');

    if (expensesToReport.length === 0) {
      lines.push('_(Sin gastos registrados en el período)_');
    } else {
      const maskedIds = options?.maskedCategoryIds ?? useCategoryStore.getState().parentMaskedCategoryIds;
      const sorted = [...expensesToReport].sort((a, b) => b.date.localeCompare(a.date));
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
          const isTagShown = options?.showNatureTags
            ? (options.showNatureTags[nat] ?? true)
            : true;
          if (isTagShown) {
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

    // Sección informativa de ingresos extra si los hay
    if (extraIncomes.length > 0 && summaryMode === 'full') {
      lines.push('📥 *Ingresos extra recibidos en el período:*');
      const sortedIncomes = [...extraIncomes].sort((a, b) => b.date.localeCompare(a.date));
      for (const inc of sortedIncomes) {
        lines.push(`• ${formatDayMonth(inc.date)}: ${inc.description} - +${formatCurrency(inc.amount)}`);
      }
      lines.push('');
    }

    // Resumen Financiero Unificado (solo gastos a rendir)
    const totalUnifiedAmount = expensesToReport.reduce(
      (sum, e) => sum + (e.type === 'real' ? e.amount + (e.savedExtraAmount || 0) : e.amount),
      0
    );

    if (summaryMode === 'total_only') {
      lines.push('📈 *Total:*');
      lines.push(`• Total a rendir: ${formatCurrency(totalUnifiedAmount)}`);
    } else {
      lines.push(STRINGS.EXPORT_WHATSAPP_SUMMARY_SECTION);
      const baseIncome = metrics.baseIncome;
      const extraIncome = metrics.extraIncome;
      const totalIncome = metrics.initialIncome; // baseIncome + extraIncome

      if (totalIncome > 0) {
        if (extraIncome > 0 && baseIncome > 0) {
          lines.push(`• Ingreso base asignado: ${formatCurrency(baseIncome)}`);
          lines.push(`• Ingresos extra recibidos: +${formatCurrency(extraIncome)}`);
          lines.push(`• Ingreso total disponible: ${formatCurrency(totalIncome)}`);
        } else {
          lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(totalIncome)}`);
        }
      }
      lines.push(`${STRINGS.EXPORT_WHATSAPP_UNIFIED_TOTAL} ${formatCurrency(totalUnifiedAmount)}`);
      if (totalIncome > 0) {
        const remaining = totalIncome - totalUnifiedAmount;
        lines.push(`${STRINGS.EXPORT_WHATSAPP_REMAINING} ${formatCurrency(remaining)}`);
      }
      const totalHouseUnified = expensesToReport
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

  // Modo Detallado: distingue gastos reales, compras postergadas e ingresos extra
  const expensesToReport = filtered.filter((e) => e.type !== 'income');
  const realExpenses = expensesToReport.filter((e) => e.type === 'real');
  const delayedExpenses = expensesToReport.filter((e) => e.type === 'delayed');
  const extraIncomes = filtered.filter((e) => e.type === 'income');

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

  // Sección de Ingresos Extra (si existen)
  if (extraIncomes.length > 0) {
    lines.push('💵 *Ingresos Extra Registrados:*');
    const sortedIncomes = [...extraIncomes].sort((a, b) => b.date.localeCompare(a.date));
    for (const inc of sortedIncomes) {
      lines.push(
        `• ${formatDayMonth(inc.date)}: ${inc.description} - +${formatCurrency(inc.amount)}`
      );
    }
    lines.push('');
  }

  // Sección de Resumen Financiero
  lines.push(STRINGS.EXPORT_WHATSAPP_SUMMARY_SECTION);
  if (metrics.initialIncome > 0) {
    lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(metrics.initialIncome)}`);
    if (metrics.extraIncome > 0 && metrics.baseIncome > 0) {
      lines.push(`• Ingreso base asignado: ${formatCurrency(metrics.baseIncome)}`);
      lines.push(`• Ingresos extra recibidos: +${formatCurrency(metrics.extraIncome)}`);
      lines.push(`• Ingreso total disponible: ${formatCurrency(metrics.initialIncome)}`);
    } else {
      lines.push(`${STRINGS.EXPORT_WHATSAPP_INCOME} ${formatCurrency(metrics.initialIncome)}`);
    }
  }
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_REAL} ${formatCurrency(metrics.totalReal)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_DELAYED} ${formatCurrency(metrics.totalDelayed)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_PENDING_TRANSFER} ${formatCurrency(metrics.pendingTransfer)}`);
  lines.push(`${STRINGS.EXPORT_WHATSAPP_TOTAL_BUDGET} ${formatCurrency(metrics.totalAccounted)}`);
  if (metrics.initialIncome > 0) {
    lines.push(`${STRINGS.EXPORT_WHATSAPP_REMAINING} ${formatCurrency(metrics.remainingBalance)}`);
  }

  const totalHouseDetailed = expensesToReport
    .filter((e) => e.type === 'real' && e.nature === 'house')
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
    .filter((e) => isExpenseMatchingFilter(e, filter, period))
    .filter((e) => {
      // Regla de privacidad de Vicios y Gastos Ficticios:
      if (unified) {
        // En reporte para padres: NUNCA mostrar Vicios (0% de probabilidad)
        if (e.categoryId === 'vices') return false;
      } else {
        // En exportación personal: los gastos ficticios son máscaras y se excluyen
        if (e.isFictitious) return false;
      }
      if (!options?.includedNatures) return true;
      const nature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');
      return options.includedNatures[nature] ?? true;
    });

  const escapeCSV = (field: string | number) => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = unified
    ? ['Fecha', 'Tipo', 'Monto', 'Categoría', 'Concepto / Detalle', 'Para la Casa']
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
      const isIncome = exp.type === 'income';
      const tipo = isIncome ? 'Ingreso Extra' : 'Gasto';
      const totalAmount =
        exp.type === 'real'
          ? exp.amount + (exp.savedExtraAmount || 0)
          : exp.amount;

      return [
        exp.date,
        tipo,
        totalAmount.toFixed(2),
        options?.showCategory === false ? '' : (isIncome ? 'Ingreso' : catName),
        exp.description,
        exp.nature === 'house' ? 'Sí' : 'No',
      ]
        .map((item) => escapeCSV(item ?? ''))
        .join(',');
    }

    const tipo =
      exp.type === 'real'
        ? 'Gasto Real'
        : exp.type === 'income'
        ? 'Ingreso Extra'
        : 'Compra Postergada';

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
      exp.type === 'income' ? 'Ingreso' : cat.name,
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
