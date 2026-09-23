import { useState, useMemo } from 'react';
import { Expense, ExpenseNature } from '../../store/types';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { ShoppingBag, RefreshCw, Zap, Home, ChevronDown, ChevronUp, Layers, X, ShieldCheck } from 'lucide-react';

interface ExpenseNatureCardProps {
  expenses: Expense[];
}

type NatureSection = 'daily' | 'fixed' | 'eventual' | 'house';

const NATURE_CONFIG: Record<
  NatureSection,
  {
    title: string;
    subtitle: string;
    icon: typeof ShoppingBag;
    bgActive: string;
    bgInactive: string;
    borderActive: string;
    borderInactive: string;
    ring: string;
    textTitle: string;
    badgeBg: string;
    badgeText: string;
    detailBg: string;
    detailBorder: string;
    detailTitle: string;
  }
> = {
  daily: {
    title: 'Cotidianos',
    subtitle: 'Impactan en el ritmo diario.',
    icon: ShoppingBag,
    bgActive: 'bg-emerald-50/90',
    bgInactive: 'bg-emerald-50/40 hover:bg-emerald-50/70',
    borderActive: 'border-emerald-300',
    borderInactive: 'border-emerald-200/60',
    ring: 'ring-2 ring-emerald-400/25',
    textTitle: 'text-emerald-950',
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-emerald-800',
    detailBg: 'bg-emerald-50/40',
    detailBorder: 'border-emerald-200',
    detailTitle: 'text-emerald-900',
  },
  fixed: {
    title: 'Fijos',
    subtitle: 'Alquiler, servicios, etc.',
    icon: RefreshCw,
    bgActive: 'bg-indigo-50/90',
    bgInactive: 'bg-indigo-50/40 hover:bg-indigo-50/70',
    borderActive: 'border-indigo-300',
    borderInactive: 'border-indigo-200/60',
    ring: 'ring-2 ring-indigo-400/25',
    textTitle: 'text-indigo-950',
    badgeBg: 'bg-indigo-100/80',
    badgeText: 'text-indigo-800',
    detailBg: 'bg-indigo-50/40',
    detailBorder: 'border-indigo-200',
    detailTitle: 'text-indigo-900',
  },
  eventual: {
    title: 'Eventuales',
    subtitle: 'Imprevistos, salidas, salud.',
    icon: Zap,
    bgActive: 'bg-amber-50/90',
    bgInactive: 'bg-amber-50/40 hover:bg-amber-50/70',
    borderActive: 'border-amber-300',
    borderInactive: 'border-amber-200/60',
    ring: 'ring-2 ring-amber-400/25',
    textTitle: 'text-amber-950',
    badgeBg: 'bg-amber-100/80',
    badgeText: 'text-amber-800',
    detailBg: 'bg-amber-50/40',
    detailBorder: 'border-amber-200',
    detailTitle: 'text-amber-900',
  },
  house: {
    title: 'Casa',
    subtitle: 'Compras para la familia.',
    icon: Home,
    bgActive: 'bg-purple-50/90',
    bgInactive: 'bg-purple-50/40 hover:bg-purple-50/70',
    borderActive: 'border-purple-300',
    borderInactive: 'border-purple-200/60',
    ring: 'ring-2 ring-purple-400/25',
    textTitle: 'text-purple-950',
    badgeBg: 'bg-purple-100/80',
    badgeText: 'text-purple-800',
    detailBg: 'bg-purple-50/40',
    detailBorder: 'border-purple-200',
    detailTitle: 'text-purple-900',
  },
};

export function ExpenseNatureCard({ expenses }: ExpenseNatureCardProps) {
  const [expandedSection, setExpandedSection] = useState<NatureSection | null>(null);

  const metrics = useMemo(() => {
    let dailySpent = 0;
    let fixedSpent = 0;
    let eventualSpent = 0;
    let houseSpent = 0;

    let dailyDelayed = 0;
    let fixedDelayed = 0;
    let eventualDelayed = 0;
    let houseDelayed = 0;

    let totalDelayed = 0;

    const dailyItems: Expense[] = [];
    const fixedItems: Expense[] = [];
    const eventualItems: Expense[] = [];
    const houseItems: Expense[] = [];

    for (const e of expenses) {
      if (e.type === 'income' || e.isFictitious) continue;

      const nature: ExpenseNature = e.nature ?? (e.isRecurring ? 'fixed' : 'daily');

      if (e.type === 'real') {
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
        if (nature === 'fixed') {
          fixedDelayed += e.amount;
          fixedItems.push(e);
        } else if (nature === 'eventual') {
          eventualDelayed += e.amount;
          eventualItems.push(e);
        } else if (nature === 'house') {
          houseDelayed += e.amount;
          houseItems.push(e);
        } else {
          dailyDelayed += e.amount;
          dailyItems.push(e);
        }
      }
    }

    // Ordenar listas de movimientos por fecha descendente
    const sortByDate = (a: Expense, b: Expense) => b.date.localeCompare(a.date);
    dailyItems.sort(sortByDate);
    fixedItems.sort(sortByDate);
    eventualItems.sort(sortByDate);
    houseItems.sort(sortByDate);

    const totalRealSpent = dailySpent + fixedSpent + eventualSpent + houseSpent;
    const dailyPercent = totalRealSpent > 0 ? (dailySpent / totalRealSpent) * 100 : 0;
    const fixedPercent = totalRealSpent > 0 ? (fixedSpent / totalRealSpent) * 100 : 0;
    const eventualPercent = totalRealSpent > 0 ? (eventualSpent / totalRealSpent) * 100 : 0;
    const housePercent = totalRealSpent > 0 ? (houseSpent / totalRealSpent) * 100 : 0;

    // Efectividad DelaySpend sobre gastos cotidianos
    const dailyAccounted = dailySpent + totalDelayed;
    const delayEffectiveness = dailyAccounted > 0 ? (totalDelayed / dailyAccounted) * 100 : 0;

    return {
      totalRealSpent,
      dailySpent,
      fixedSpent,
      eventualSpent,
      houseSpent,
      dailyDelayed,
      fixedDelayed,
      eventualDelayed,
      houseDelayed,
      totalDelayed,
      dailyPercent,
      fixedPercent,
      eventualPercent,
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

  const toggleSection = (section: NatureSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const sectionsData: Record<
    NatureSection,
    { spent: number; items: Expense[]; delayed: number }
  > = {
    daily: { spent: metrics.dailySpent, items: metrics.dailyItems, delayed: metrics.dailyDelayed },
    fixed: { spent: metrics.fixedSpent, items: metrics.fixedItems, delayed: metrics.fixedDelayed },
    eventual: { spent: metrics.eventualSpent, items: metrics.eventualItems, delayed: metrics.eventualDelayed },
    house: { spent: metrics.houseSpent, items: metrics.houseItems, delayed: metrics.houseDelayed },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">
              Desglose por Naturaleza de Gasto
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate">
              Total real: {formatCurrency(metrics.totalRealSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra segmentada */}
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

        {/* Leyenda de porcentajes de la barra en grid prolijo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 text-[10px] font-semibold text-slate-500">
          <span className="flex items-center gap-1 text-emerald-700 truncate min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Cotidianos {metrics.dailyPercent.toFixed(0)}%</span>
          </span>
          <span className="flex items-center gap-1 text-indigo-700 truncate min-w-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="truncate">Fijos {metrics.fixedPercent.toFixed(0)}%</span>
          </span>
          <span className="flex items-center gap-1 text-amber-700 truncate min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="truncate">Eventuales {metrics.eventualPercent.toFixed(0)}%</span>
          </span>
          <span className="flex items-center gap-1 text-purple-700 truncate min-w-0">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <span className="truncate">Casa {metrics.housePercent.toFixed(0)}%</span>
          </span>
        </div>
      </div>

      {/* Grid de 4 pastillas interactivas para auditar gastos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(NATURE_CONFIG) as NatureSection[]).map((sectionKey) => {
          const cfg = NATURE_CONFIG[sectionKey];
          const data = sectionsData[sectionKey];
          const isExpanded = expandedSection === sectionKey;
          const Icon = cfg.icon;

          return (
            <button
              key={sectionKey}
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className={`flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer min-w-0 overflow-hidden ${
                isExpanded
                  ? `${cfg.bgActive} ${cfg.borderActive} ${cfg.ring}`
                  : `${cfg.bgInactive} ${cfg.borderInactive}`
              }`}
            >
              {/* Header de la pastilla */}
              <div className="flex items-center justify-between gap-1 w-full min-w-0">
                <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.textTitle} truncate min-w-0 flex-1`}>
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{cfg.title}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-[10px] font-bold ${cfg.badgeText} ${cfg.badgeBg} px-1.5 py-0.5 rounded-md leading-none`}>
                    {data.items.length}
                  </span>
                  <span className="text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-slate-700" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    )}
                  </span>
                </div>
              </div>

              {/* Monto e información */}
              <div className="mt-2 w-full min-w-0">
                <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate block">
                  {formatCurrency(data.spent)}
                </span>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug line-clamp-1 truncate">
                  {cfg.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalle expandible de gastos de la naturaleza seleccionada */}
      {expandedSection && (
        <div
          className={`flex flex-col gap-2 p-3 rounded-xl border text-xs min-w-0 overflow-hidden ${
            NATURE_CONFIG[expandedSection].detailBg
          } ${NATURE_CONFIG[expandedSection].detailBorder}`}
        >
          {/* Cabecera del desglose */}
          <div className="flex items-center justify-between gap-2 min-w-0 pb-1 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`font-bold text-[11px] uppercase tracking-wider truncate ${NATURE_CONFIG[expandedSection].detailTitle}`}>
                Detalle: {NATURE_CONFIG[expandedSection].title}
              </span>
              <span className="text-[10px] text-slate-500 font-medium shrink-0">
                ({sectionsData[expandedSection].items.length} {sectionsData[expandedSection].items.length === 1 ? 'movimiento' : 'movimientos'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedSection(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer shrink-0 transition-colors"
              title="Cerrar detalle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lista de gastos con scroll contenido y protección anti-desbordes */}
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
            {sectionsData[expandedSection].items.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">
                No hay movimientos registrados en esta categoría para este período.
              </p>
            ) : (
              sectionsData[expandedSection].items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-200/50 last:border-0 gap-2 min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-slate-400 text-[10px] font-medium shrink-0">
                      {formatDayMonth(item.date)}
                    </span>
                    <span className="font-semibold text-slate-700 text-xs truncate min-w-0 block">
                      {item.description}
                    </span>
                    {item.type === 'delayed' && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-1 py-0.5 rounded-sm shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Delay
                      </span>
                    )}
                    {item.savedExtraAmount && item.savedExtraAmount > 0 && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1 py-0.5 rounded-sm shrink-0">
                        💡 +{formatCurrency(item.savedExtraAmount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center shrink-0 ml-1">
                    {item.type === 'delayed' ? (
                      <span className="font-bold text-xs text-emerald-600 text-right">
                        +{formatCurrency(item.amount)}
                      </span>
                    ) : (
                      <span className="font-bold text-xs text-slate-900 text-right">
                        -{formatCurrency(item.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer informativo adaptable a pantallas pequeñas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 gap-1.5 min-w-0">
        <span className="text-slate-600 break-words leading-snug">
          Casa, fijos e imprevistos consumieron{' '}
          <strong className="text-slate-800 font-bold">
            {formatCurrency(metrics.houseSpent + metrics.fixedSpent + metrics.eventualSpent)}
          </strong>{' '}
          ({(metrics.housePercent + metrics.fixedPercent + metrics.eventualPercent).toFixed(0)}% del total).
        </span>
        {metrics.totalDelayed > 0 && (
          <span className="text-emerald-700 font-semibold break-words leading-snug">
            Efectividad DelaySpend en cotidianos: {metrics.delayEffectiveness.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
