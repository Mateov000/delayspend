import { useState, useMemo } from 'react';
import { Expense } from '../../store/types';
import { CATEGORIES } from '../../constants/categories';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { Tag, X } from 'lucide-react';

interface CategoryDonutChartProps {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f59e0b',
  supermarket: '#3b82f6',
  transport: '#0ea5e9',
  leisure: '#a855f7',
  clothing: '#ec4899',
  tech: '#6366f1',
  subscriptions: '#06b6d4',
  health: '#f43f5e',
  education: '#10b981',
  other: '#64748b',
};

interface Slice {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

function buildSlices(expenses: Expense[]): Slice[] {
  const totals = new Map<string, number>();
  for (const exp of expenses) {
    if (exp.type !== 'real') continue;
    totals.set(exp.categoryId, (totals.get(exp.categoryId) ?? 0) + exp.amount);
  }

  const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v, 0);
  if (grandTotal === 0) return [];

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => {
      const cat = CATEGORIES.find((c) => c.id === categoryId);
      return {
        categoryId,
        name: cat?.name ?? 'Otros',
        amount,
        percentage: (amount / grandTotal) * 100,
        color: CATEGORY_COLORS[categoryId] ?? '#64748b',
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: cx + r * Math.cos(startAngle - Math.PI / 2),
    y: cy + r * Math.sin(startAngle - Math.PI / 2),
  };
  const end = {
    x: cx + r * Math.cos(endAngle - Math.PI / 2),
    y: cy + r * Math.sin(endAngle - Math.PI / 2),
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function computeArcs(
  slices: Slice[],
  activeIdx: number | null,
  cx: number,
  cy: number,
  rOuter: number
) {
  let cumAngle = 0;
  return slices.map((slice, i) => {
    const angleSpan = (slice.percentage / 100) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angleSpan;
    cumAngle = endAngle;
    const isActive = activeIdx === i;
    const rO = isActive ? rOuter + 5 : rOuter;
    const d = describeArc(cx, cy, rO, startAngle, endAngle);
    return { ...slice, d, startAngle, endAngle, isActive };
  });
}

export function CategoryDonutChart({ expenses }: CategoryDonutChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const slices = useMemo(() => buildSlices(expenses), [expenses]);

  const totalReal = useMemo(
    () => expenses.filter((e) => e.type === 'real').reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  const activeSlice = activeIdx !== null ? slices[activeIdx] : null;

  // Gastos reales de la categoría seleccionada para el desglose detallado
  const categoryExpenses = useMemo(() => {
    if (!activeSlice) return [];
    return expenses
      .filter((e) => e.type === 'real' && e.categoryId === activeSlice.categoryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, activeSlice]);

  if (slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-1">
        <span className="text-2xl">🍩</span>
        <span>No hay gastos reales en este período</span>
      </div>
    );
  }

  const cx = 80;
  const cy = 80;
  const rOuter = 70;
  const rInner = 44;
  const size = 160;

  const arcs = computeArcs(slices, activeIdx, cx, cy, rOuter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {arcs.map((arc, i) => (
              <path
                key={arc.categoryId}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={arc.isActive ? 20 : 14}
                strokeLinecap="round"
                style={{ cursor: 'pointer', transition: 'stroke-width 0.15s, d 0.15s' }}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                aria-label={`${arc.name}: ${formatCurrency(arc.amount)}`}
              />
            ))}
            <circle cx={cx} cy={cy} r={rInner - 4} fill="white" />
            {activeSlice ? (
              <>
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill="#475569"
                  className="select-none"
                >
                  {activeSlice.name.length > 14 ? activeSlice.name.slice(0, 13) + '…' : activeSlice.name}
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#1e293b"
                  className="select-none"
                >
                  {activeSlice.percentage.toFixed(0)}%
                </text>
              </>
            ) : (
              <>
                <text
                  x={cx}
                  y={cy - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill="#94a3b8"
                  className="select-none"
                >
                  Total gastado
                </text>
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="#1e293b"
                  className="select-none"
                >
                  {formatCurrency(totalReal).replace('$', '$')}
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Leyenda clickeable */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {slices.slice(0, 6).map((slice, i) => (
            <button
              key={slice.categoryId}
              type="button"
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
              className={`flex items-center gap-2 text-left transition-opacity cursor-pointer ${
                activeIdx !== null && activeIdx !== i ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-[11px] text-slate-600 truncate max-w-[110px]">{slice.name}</span>
              <span className="text-[11px] font-bold text-slate-800 ml-auto pl-1 shrink-0">
                {slice.percentage.toFixed(0)}%
              </span>
            </button>
          ))}
          {slices.length > 6 && (
            <span className="text-[10px] text-slate-400 pl-4">
              +{slices.length - 6} más
            </span>
          )}
        </div>
      </div>

      {/* Banner de categoría activa */}
      {activeSlice && (
        <div
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs"
          style={{ backgroundColor: activeSlice.color + '18', border: `1px solid ${activeSlice.color}40` }}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{activeSlice.name}</span>
            <span className="text-[10px] text-slate-500 font-medium">({activeSlice.percentage.toFixed(0)}% del total)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900">{formatCurrency(activeSlice.amount)}</span>
            <button
              type="button"
              onClick={() => setActiveIdx(null)}
              className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Cerrar desglose"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* DESGLOSE DETALLADO DE GASTOS DE LA CATEGORÍA SELECCIONADA */}
      {activeSlice && categoryExpenses.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {categoryExpenses.length} gasto{categoryExpenses.length !== 1 ? 's' : ''} en {activeSlice.name}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Tocá un gasto o cerrá</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {categoryExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/90 text-xs hover:border-slate-200 transition-colors"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold text-slate-800 truncate leading-snug">
                    {exp.description}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{formatDayMonth(exp.date)}</span>
                    {exp.savedExtraAmount && exp.savedExtraAmount > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded-sm border border-emerald-200/60">
                        💡 +{formatCurrency(exp.savedExtraAmount)} ahorro
                      </span>
                    )}
                    {exp.tags && exp.tags.length > 0 && (
                      <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                        <Tag className="w-2.5 h-2.5" />
                        {exp.tags.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="font-bold text-slate-900">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
