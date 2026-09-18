import { useState, useMemo } from 'react';
import { Expense } from '../../store/types';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import {
  Flame,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ViceBalanceCardProps {
  expenses: Expense[];
  onOpenCreateFictitious: () => void;
  onOpenCreateVice: () => void;
}

export function ViceBalanceCard({
  expenses,
  onOpenCreateFictitious,
  onOpenCreateVice,
}: ViceBalanceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Gastos de vicios (no linked)
  const viceExpenses = useMemo(
    () => expenses.filter((e) => !e.linkedExpenseId && e.categoryId === 'vices'),
    [expenses]
  );

  // Gastos ficticios (máscaras contables)
  const fictitiousExpenses = useMemo(
    () => expenses.filter((e) => !e.linkedExpenseId && Boolean(e.isFictitious)),
    [expenses]
  );

  const totalVices = useMemo(
    () => viceExpenses.reduce((sum, e) => sum + e.amount, 0),
    [viceExpenses]
  );

  const totalFictitious = useMemo(
    () => fictitiousExpenses.reduce((sum, e) => sum + e.amount, 0),
    [fictitiousExpenses]
  );

  // Balance = Gastos Ficticios - Gastos en Vicios
  const balance = Math.round((totalFictitious - totalVices) * 100) / 100;
  const isCovered = balance >= 0;
  const hasActivity = totalVices > 0 || totalFictitious > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Encabezado de la Tarjeta */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0">
              <span className="text-base leading-none">🎭</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100">Balance Ficticio - Vicios</span>
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="¿Cómo funciona el balance?"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-slate-300 block">
                Compensación contable para el reporte de padres
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Balance Neto
            </span>
            <span
              className={`text-base font-extrabold tracking-tight ${
                isCovered
                  ? balance > 0
                    ? 'text-emerald-400'
                    : 'text-slate-200'
                  : 'text-amber-400'
              }`}
            >
              {balance > 0 ? `+${formatCurrency(balance)}` : formatCurrency(balance)}
            </span>
          </div>
        </div>

        {/* Explicación si se toca el ícono de ayuda */}
        {showInfo && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 leading-relaxed animate-in fade-in duration-150">
            <p className="mb-1">
              • <strong>Vicios:</strong> Tus compras en puchos, etc. (0% de probabilidad de mostrarse a tus padres).
            </p>
            <p className="mb-1">
              • <strong>Gastos Ficticios:</strong> Compras inventadas (comida, alfajores, etc.) que figuran como reales en el reporte para padres.
            </p>
            <p>
              • <strong>Fórmula:</strong> Ficticios - Vicios = Balance. Si da positivo o cero, el dinero gastado en vicios está totalmente compensado ante tus padres sin preguntas.
            </p>
          </div>
        )}
      </div>

      {/* Cuerpo principal con los dos totales y el estado */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Tarjeta Vicios */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-900 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Vicios reales</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-amber-950">
                {formatCurrency(totalVices)}
              </span>
              <span className="text-[10px] text-amber-700 font-medium">
                {viceExpenses.length} {viceExpenses.length === 1 ? 'gasto' : 'gastos'}
              </span>
            </div>
          </div>

          {/* Tarjeta Ficticios */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-purple-900 mb-1">
              <span className="text-xs">🎭</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Ficticios cargados</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-purple-950">
                {formatCurrency(totalFictitious)}
              </span>
              <span className="text-[10px] text-purple-700 font-medium">
                {fictitiousExpenses.length} {fictitiousExpenses.length === 1 ? 'máscara' : 'máscaras'}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de Estado */}
        <div
          className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs leading-snug ${
            isCovered
              ? balance > 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-slate-50 text-slate-800 border-slate-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          {isCovered ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block">
              {isCovered
                ? balance > 0
                  ? `Superávit de cobertura: +${formatCurrency(balance)}`
                  : 'Balance al día ($0)'
                : `Faltan compensar: ${formatCurrency(Math.abs(balance))}`}
            </span>
            <span className="text-[11px] opacity-80 block mt-0.5">
              {isCovered
                ? balance > 0
                  ? 'Tus gastos de vicios están cubiertos ante tus padres con margen a favor.'
                  : 'Tus gastos ficticios compensan exactamente los gastos en vicios del período.'
                : 'Cargá un gasto ficticio (ej: comida, súper) para justificar esta diferencia en el reporte.'}
            </span>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={onOpenCreateFictitious}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>🎭</span>
            <span>+ Máscara ficticia</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateVice}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Vicio</span>
          </button>
        </div>

        {/* Desplegable para ver detalle de gastos si hay actividad */}
        {hasActivity && (
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-slate-500 hover:text-slate-800 text-[11px] font-semibold py-1 cursor-pointer transition-colors"
            >
              <span>{isExpanded ? 'Ocultar desglose detallado' : 'Ver compras y máscaras del período'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-2.5 pt-2 animate-in fade-in duration-150 text-xs">
                {/* Lista de Vicios */}
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    Gastos en Vicios (Sensibles):
                  </span>
                  {viceExpenses.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Sin gastos de vicios en este ciclo</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {viceExpenses.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between py-1 px-2 rounded-lg bg-amber-50/60 border border-amber-100 text-[11px]"
                        >
                          <span className="text-amber-950 font-medium truncate">
                            {formatDayMonth(v.date)} · {v.description}
                            {v.subcategory && (
                              <span className="text-[10px] text-amber-700 ml-1">({v.subcategory})</span>
                            )}
                          </span>
                          <span className="font-bold text-amber-900 shrink-0 ml-2">
                            {formatCurrency(v.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lista de Ficticios */}
                <div>
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">
                    Máscaras Ficticias (Visibles a padres):
                  </span>
                  {fictitiousExpenses.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">Sin máscaras creadas aún</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {fictitiousExpenses.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between py-1 px-2 rounded-lg bg-purple-50/60 border border-purple-100 text-[11px]"
                        >
                          <span className="text-purple-950 font-medium truncate">
                            {formatDayMonth(f.date)} · {f.description}
                          </span>
                          <span className="font-bold text-purple-900 shrink-0 ml-2">
                            +{formatCurrency(f.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
