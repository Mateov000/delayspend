import { useState, useMemo } from 'react';
import { Expense } from '../../store/types';
import { formatCurrency } from '../../utils/format';
import { ShoppingBag, RefreshCw, Zap, Home, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface ExpenseNatureCardProps {
  expenses: Expense[];
}

export function ExpenseNatureCard({ expenses }: ExpenseNatureCardProps) {
  const [expandedSection, setExpandedSection] = useState<'fixed' | 'eventual' | 'house' | null>(null);

  const metrics = useMemo(() => {
    let dailySpent = 0;
    let fixedSpent = 0;
    let eventualSpent = 0;
    let houseSpent = 0;
    let totalDelayed = 0;

    const dailyItems: Expense[] = [];
    const fixedItems: Expense[] = [];
    const eventualItems: Expense[] = [];
    const houseItems: Expense[] = [];

    for (const e of expenses) {
      if (e.type === 'income') continue;

      if (e.type === 'real') {
        const nature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');
        if (nature === 'fixed') {
          fixedSpent += e.amount;
          fixedItems.push(e);
        } else if (nature === 'eventual') {
          eventualSpent += e.amount;
          eventualItems.push(e);
        } else if (nature === 'house') {
          houseSpent += e.amount;
          houseItems.push(e);
        } else {
          dailySpent += e.amount;
          dailyItems.push(e);
        }

        if (e.savedExtraAmount && e.savedExtraAmount > 0) {
          totalDelayed += e.savedExtraAmount;
        }
      } else if (e.type === 'delayed') {
        totalDelayed += e.amount;
      }
    }

    const totalRealSpent = dailySpent + fixedSpent + eventualSpent + houseSpent;
    const dailyPercent = totalRealSpent > 0 ? (dailySpent / totalRealSpent) * 100 : 0;
    const fixedPercent = totalRealSpent > 0 ? (fixedSpent / totalRealSpent) * 100 : 0;
    const eventualPercent = totalRealSpent > 0 ? (eventualSpent / totalRealSpent) * 100 : 0;
    const housePercent = totalRealSpent > 0 ? (houseSpent / totalRealSpent) * 100 : 0;

    // Efectividad DelaySpend sobre los gastos cotidianos (los que son postergables)
    const dailyAccounted = dailySpent + totalDelayed;
    const delayEffectiveness = dailyAccounted > 0 ? (totalDelayed / dailyAccounted) * 100 : 0;

    return {
      totalRealSpent,
      dailySpent,
      fixedSpent,
      eventualSpent,
      totalDelayed,
      dailyPercent,
      fixedPercent,
      eventualPercent,
      houseSpent,
      housePercent,
      delayEffectiveness,
      dailyItems,
      fixedItems,
      eventualItems,
      houseItems,
    };
  }, [expenses]);

  if (metrics.totalRealSpent <= 0 && metrics.totalDelayed <= 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs text-center">
        <p className="text-xs text-slate-400 font-medium">
          No hay gastos registrados en este período para analizar su naturaleza.
        </p>
      </div>
    );
  }

  const toggleSection = (section: 'fixed' | 'eventual' | 'house') => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">
              Desglose por Naturaleza de Gasto
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Total real: {formatCurrency(metrics.totalRealSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra segmentada tricromática */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${metrics.dailyPercent}%` }}
            title={`Cotidianos: ${formatCurrency(metrics.dailySpent)} (${metrics.dailyPercent.toFixed(0)}%)`}
          />
          <div
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${metrics.fixedPercent}%` }}
            title={`Fijos: ${formatCurrency(metrics.fixedSpent)} (${metrics.fixedPercent.toFixed(0)}%)`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${metrics.eventualPercent}%` }}
            title={`Eventuales: ${formatCurrency(metrics.eventualSpent)} (${metrics.eventualPercent.toFixed(0)}%)`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{ width: `${metrics.housePercent}%` }}
            title={`Para la casa: ${formatCurrency(metrics.houseSpent)} (${metrics.housePercent.toFixed(0)}%)`}
          />
        </div>

        {/* Leyenda de porcentajes de la barra */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-0.5 flex-wrap gap-1">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Cotidianos {metrics.dailyPercent.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Fijos {metrics.fixedPercent.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Eventuales {metrics.eventualPercent.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-purple-700">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Casa {metrics.housePercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Grid de 3 pastillas interactivas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Cotidianos */}
        <div className="flex flex-col justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cotidianos</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md">
              {metrics.dailyItems.length} compras
            </span>
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-slate-900 leading-none">
              {formatCurrency(metrics.dailySpent)}
            </span>
            <p className="text-[10px] text-emerald-700/90 font-medium mt-1">
              Impactan en el ritmo diario del ciclo.
            </p>
          </div>
        </div>

        {/* 2. Fijos */}
        <div
          onClick={() => metrics.fixedItems.length > 0 && toggleSection('fixed')}
          className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
            metrics.fixedItems.length > 0 ? 'cursor-pointer hover:border-indigo-300' : ''
          } ${
            expandedSection === 'fixed'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/20'
              : 'bg-indigo-50/40 border-indigo-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fijos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded-md">
                {metrics.fixedItems.length}
              </span>
              {metrics.fixedItems.length > 0 && (
                <span className="text-indigo-600">
                  {expandedSection === 'fixed' ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-slate-900 leading-none">
              {formatCurrency(metrics.fixedSpent)}
            </span>
            <p className="text-[10px] text-indigo-700/90 font-medium mt-1">
              Alquiler, servicios, etc (aislado de ritmo).
            </p>
          </div>
        </div>

        {/* 3. Eventuales */}
        <div
          onClick={() => metrics.eventualItems.length > 0 && toggleSection('eventual')}
          className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
            metrics.eventualItems.length > 0 ? 'cursor-pointer hover:border-amber-300' : ''
          } ${
            expandedSection === 'eventual'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-amber-50/40 border-amber-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Eventuales</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                {metrics.eventualItems.length}
              </span>
              {metrics.eventualItems.length > 0 && (
                <span className="text-amber-600">
                  {expandedSection === 'eventual' ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-slate-900 leading-none">
              {formatCurrency(metrics.eventualSpent)}
            </span>
            <p className="text-[10px] text-amber-700/90 font-medium mt-1">
              Peluquería, dentista, etc.
            </p>
          </div>
        </div>

        {/* 4. Para la casa */}
        <div
          onClick={() => metrics.houseItems.length > 0 && toggleSection('house')}
          className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
            metrics.houseItems.length > 0 ? 'cursor-pointer hover:border-purple-300' : ''
          } ${
            expandedSection === 'house'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/20'
              : 'bg-purple-50/40 border-purple-200/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Home className="w-3.5 h-3.5 text-purple-600" />
              <span>Casa</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded-md">
                {metrics.houseItems.length}
              </span>
              {metrics.houseItems.length > 0 && (
                <span className="text-purple-600">
                  {expandedSection === 'house' ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-slate-900 leading-none">
              {formatCurrency(metrics.houseSpent)}
            </span>
            <p className="text-[10px] text-purple-700/90 font-medium mt-1">
              Compras para el hogar/familia.
            </p>
          </div>
        </div>
      </div>

      {/* Detalle expandible de gastos Fijos */}
      {expandedSection === 'fixed' && metrics.fixedItems.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs">
          <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wider mb-0.5">
            Detalle de Gastos Fijos
          </span>
          {metrics.fixedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 border-b border-indigo-100 last:border-0"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 text-[10px]">{item.date.slice(5)}</span>
                <span className="font-semibold text-slate-700 truncate">{item.description}</span>
              </div>
              <span className="font-bold text-indigo-800 shrink-0 ml-2">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Detalle expandible de gastos Eventuales */}
      {expandedSection === 'eventual' && metrics.eventualItems.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
          <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wider mb-0.5">
            Detalle de Gastos Eventuales
          </span>
          {metrics.eventualItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 border-b border-amber-100 last:border-0"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 text-[10px]">{item.date.slice(5)}</span>
                <span className="font-semibold text-slate-700 truncate">{item.description}</span>
              </div>
              <span className="font-bold text-amber-800 shrink-0 ml-2">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Detalle expandible de gastos Para la casa */}
      {expandedSection === 'house' && metrics.houseItems.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-purple-50/50 border border-purple-200 text-xs">
          <span className="font-bold text-purple-900 text-[11px] uppercase tracking-wider mb-0.5">
            Detalle de Gastos Para la Casa
          </span>
          {metrics.houseItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 border-b border-purple-100 last:border-0"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 text-[10px]">{item.date.slice(5)}</span>
                <span className="font-semibold text-slate-700 truncate">{item.description}</span>
              </div>
              <span className="font-bold text-purple-800 shrink-0 ml-2">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer informativo de conclusión */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-1.5">
        <span className="text-slate-600">
          Casa, fijos e imprevistos consumieron{' '}
          <strong className="text-slate-800">
            {formatCurrency(metrics.houseSpent + metrics.fixedSpent + metrics.eventualSpent)}
          </strong>{' '}
          ({(metrics.housePercent + metrics.fixedPercent + metrics.eventualPercent).toFixed(0)}% del total).
        </span>
        {metrics.totalDelayed > 0 && (
          <span className="text-emerald-700 font-semibold shrink-0">
            Efectividad DelaySpend en cotidianos: {metrics.delayEffectiveness.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}

