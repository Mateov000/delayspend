import { useState, useMemo } from 'react';
import { Expense, Period } from '../../store/types';
import { isExpenseInPeriod } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface PeriodBarChartProps {
  expenses: Expense[];
  periods: Period[];
  selectedPeriodId?: string;
  onSelectPeriod?: (periodId: string) => void;
}

interface PeriodBarData {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  initialIncome: number;
  hasIncome: boolean;
  totalReal: number;
  totalDelayed: number;
  totalExtraIncome: number;
  totalAccounted: number;
  sobrante: number;
  excedente: number;
  isOver: boolean;
  savingsRate: number;
}

function buildPeriodBars(expenses: Expense[], periods: Period[]): PeriodBarData[] {
  const sorted = [...periods]
    .filter((p) => !p.deletedAt)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return sorted.map((period) => {
    const periodExpenses = expenses.filter((e) => !e.isFictitious && isExpenseInPeriod(e, period));
    let totalReal = 0;
    let totalDelayed = 0;
    let totalExtraIncome = 0;

    for (const exp of periodExpenses) {
      if (exp.type === 'real') {
        totalReal += exp.amount;
        if (exp.savedExtraAmount && exp.savedExtraAmount > 0) {
          totalDelayed += exp.savedExtraAmount;
        }
      } else if (exp.type === 'delayed') {
        totalDelayed += exp.amount;
      } else if (exp.type === 'income') {
        totalExtraIncome += exp.amount;
      }
    }

    const totalAccounted = totalReal + totalDelayed;
    const initialIncome = (period.initialIncome || 0) + totalExtraIncome;
    const hasIncome = initialIncome > 0;
    const sobrante = hasIncome ? Math.max(0, initialIncome - totalAccounted) : 0;
    const excedente = hasIncome ? Math.max(0, totalAccounted - initialIncome) : 0;
    const isOver = hasIncome && totalAccounted > initialIncome;
    const totalSaved = totalDelayed + sobrante;
    const savingsRate = hasIncome ? Math.round((totalSaved / initialIncome) * 100) : 0;

    return {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      initialIncome,
      hasIncome,
      totalReal,
      totalDelayed,
      totalExtraIncome,
      totalAccounted,
      sobrante,
      excedente,
      isOver,
      savingsRate,
    };
  });
}

export function PeriodBarChart({
  expenses,
  periods,
  selectedPeriodId,
  onSelectPeriod,
}: PeriodBarChartProps) {
  const [mode, setMode] = useState<'proportional' | 'percentage'>('proportional');
  const bars = useMemo(() => buildPeriodBars(expenses, periods), [expenses, periods]);

  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-1">
        <span className="text-2xl">📊</span>
        <span>No hay períodos para comparar</span>
      </div>
    );
  }

  const maxScale = Math.max(
    ...bars.map((b) => Math.max(b.initialIncome, b.totalAccounted)),
    1
  );

  const visibleBars = bars.slice(-8);

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de modo de escala */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Modo de visualización
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('proportional')}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'proportional'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Escala Real ($)
          </button>
          <button
            type="button"
            onClick={() => setMode('percentage')}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              mode === 'percentage'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            % del Ingreso
          </button>
        </div>
      </div>

      {/* Lista de barras de períodos */}
      <div className="flex flex-col gap-4">
        {visibleBars.map((bar) => {
          let realWidth = 0;
          let delayedWidth = 0;
          let sobranteWidth = 0;
          let budgetBoundaryWidth = 100;

          if (mode === 'proportional') {
            budgetBoundaryWidth = bar.hasIncome
              ? Math.min(100, (bar.initialIncome / maxScale) * 100)
              : Math.min(100, (bar.totalAccounted / maxScale) * 100);

            realWidth = Math.min(100, (bar.totalReal / maxScale) * 100);
            delayedWidth = Math.min(100 - realWidth, (bar.totalDelayed / maxScale) * 100);
            sobranteWidth = bar.hasIncome
              ? Math.max(0, budgetBoundaryWidth - (realWidth + delayedWidth))
              : 0;
          } else {
            const base = bar.hasIncome ? bar.initialIncome : Math.max(bar.totalAccounted, 1);
            realWidth = Math.min(100, (bar.totalReal / base) * 100);
            delayedWidth = Math.min(100 - realWidth, (bar.totalDelayed / base) * 100);
            sobranteWidth = Math.max(0, 100 - (realWidth + delayedWidth));
            budgetBoundaryWidth = 100;
          }

          const hasOverrun = bar.isOver && bar.excedente > 0;
          const isSelected = selectedPeriodId === bar.id;

          return (
            <div
              key={bar.id}
              onClick={() => onSelectPeriod?.(bar.id)}
              className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-100 hover:border-slate-200 hover:bg-slate-100/60'
              } ${onSelectPeriod ? 'cursor-pointer' : ''}`}
              title={onSelectPeriod ? `Hacé clic para analizar ${bar.name}` : undefined}
            >
              {/* Cabecera del período */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {bar.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-bold shrink-0 shadow-2xs">
                      En análisis
                    </span>
                  )}
                  {bar.hasIncome && (
                    <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                      Ingreso: {formatCurrency(bar.initialIncome)}
                    </span>
                  )}
                </div>

                {/* Badge de resultado financiero */}
                {bar.hasIncome && (
                  <div className="shrink-0">
                    {hasOverrun ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Excedido +{formatCurrency(bar.excedente)}
                      </span>
                    ) : bar.sobrante > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        Sobraron {formatCurrency(bar.sobrante)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">
                        Exacto ({formatCurrency(bar.initialIncome)})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Contenedor de la barra visual */}
              <div className="relative w-full h-3.5 bg-slate-200/60 rounded-full overflow-hidden flex items-center">
                {realWidth > 0 && (
                  <div
                    className="bg-rose-500 h-full transition-all duration-300 first:rounded-l-full"
                    style={{ width: `${realWidth}%` }}
                    title={`Gasto Real: ${formatCurrency(bar.totalReal)}`}
                  />
                )}

                {delayedWidth > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${delayedWidth}%` }}
                    title={`DelaySpend: ${formatCurrency(bar.totalDelayed)}`}
                  />
                )}

                {sobranteWidth > 0 && (
                  <div
                    className="bg-emerald-100/90 h-full border-l border-emerald-200/60 transition-all duration-300"
                    style={{ width: `${sobranteWidth}%` }}
                    title={`Sobrante no gastado: ${formatCurrency(bar.sobrante)}`}
                  />
                )}

                {hasOverrun && mode === 'proportional' && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-700 z-10 shadow-xs"
                    style={{ left: `${budgetBoundaryWidth}%` }}
                    title={`Tope de Ingreso: ${formatCurrency(bar.initialIncome)}`}
                  />
                )}
              </div>

              {/* Métricas al pie de la barra */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 flex-wrap gap-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    Real: <strong className="text-slate-700">{formatCurrency(bar.totalReal)}</strong>
                  </span>
                  {bar.totalDelayed > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      Delay: <strong className="text-slate-700">{formatCurrency(bar.totalDelayed)}</strong>
                    </span>
                  )}
                  {bar.hasIncome && bar.sobrante > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 border border-emerald-400 shrink-0" />
                      Sobrante: <strong className="text-emerald-700">{formatCurrency(bar.sobrante)}</strong>
                    </span>
                  )}
                </div>

                {bar.hasIncome && (
                  <span className="font-semibold text-slate-400 ml-auto pl-1">
                    {Math.round(((bar.totalReal) / bar.initialIncome) * 100)}% gastado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda explicativa al pie */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            Gasto Real
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            DelaySpend
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300 inline-block" />
            Sobrante no gastado
          </span>
        </div>
      </div>
    </div>
  );
}
