import { useMemo } from 'react';
import { Expense, Period } from '../../store/types';
import { isExpenseInPeriod } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

interface PeriodBarChartProps {
  expenses: Expense[];
  periods: Period[];
}

interface PeriodBar {
  id: string;
  name: string;
  totalReal: number;
  totalDelayed: number;
  total: number;
}

function buildPeriodBars(expenses: Expense[], periods: Period[]): PeriodBar[] {
  const sorted = [...periods]
    .filter((p) => !p.deletedAt)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return sorted.map((period) => {
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
    return {
      id: period.id,
      name: period.name,
      totalReal,
      totalDelayed,
      total: totalReal + totalDelayed,
    };
  });
}

export function PeriodBarChart({ expenses, periods }: PeriodBarChartProps) {
  const bars = useMemo(() => buildPeriodBars(expenses, periods), [expenses, periods]);

  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-1">
        <span className="text-2xl">📊</span>
        <span>No hay períodos para comparar</span>
      </div>
    );
  }

  const maxTotal = Math.max(...bars.map((b) => b.total), 1);
  // Mostrar máximo 8 períodos, los más recientes
  const visible = bars.slice(-8);

  return (
    <div className="flex flex-col gap-3">
      {visible.map((bar) => {
        const realPct = Math.min(100, (bar.totalReal / maxTotal) * 100);
        const delayedPct = Math.min(100 - realPct, (bar.totalDelayed / maxTotal) * 100);
        const isEmpty = bar.total === 0;

        return (
          <div key={bar.id} className="flex flex-col gap-1">
            {/* Nombre del período */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[160px]">
                {bar.name}
              </span>
              <span className="text-[11px] font-bold text-slate-800 ml-2 shrink-0">
                {isEmpty ? '—' : formatCurrency(bar.total)}
              </span>
            </div>

            {/* Barra apilada */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full rounded-l-full transition-all duration-300"
                style={{ width: `${realPct}%` }}
                title={`Real: ${formatCurrency(bar.totalReal)}`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${delayedPct}%` }}
                title={`DelaySpend: ${formatCurrency(bar.totalDelayed)}`}
              />
            </div>

            {/* Subtotales */}
            {!isEmpty && (
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Real: <strong className="text-slate-700">{formatCurrency(bar.totalReal)}</strong>
                </span>
                {bar.totalDelayed > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Delay: <strong className="text-slate-700">{formatCurrency(bar.totalDelayed)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Leyenda global */}
      <div className="flex items-center gap-4 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
          Gastado real
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          DelaySpend
        </span>
      </div>
    </div>
  );
}

