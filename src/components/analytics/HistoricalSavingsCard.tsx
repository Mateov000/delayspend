import { useState } from 'react';
import { ShieldCheck, TrendingUp, PiggyBank, ChevronDown, ChevronUp, Sparkles, Ban } from 'lucide-react';
import { HistoricalSavings } from '../../utils/historicalSavings';
import { formatCurrency } from '../../utils/format';

interface HistoricalSavingsCardProps {
  savings: HistoricalSavings;
}

export function HistoricalSavingsCard({ savings }: HistoricalSavingsCardProps) {
  const [isDelaySpendExpanded, setIsDelaySpendExpanded] = useState(false);
  const hasData = savings.delaySpendSavings !== 0 || savings.incomeLeftoverSavings !== 0;

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/60">
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
          <PiggyBank className="w-5 h-5 text-emerald-300" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
            Ahorro Acumulado
          </p>
          <p className="text-[11px] text-emerald-200/70">
            {savings.closedPeriodsCount > 0
              ? `Consolidado de ${savings.closedPeriodsCount} ciclo${savings.closedPeriodsCount !== 1 ? 's' : ''} cerrado${savings.closedPeriodsCount !== 1 ? 's' : ''}`
              : 'Se computa al concluir cada ciclo'}
          </p>
        </div>
      </div>

      {/* Monto total grande: DelaySpend + Sobrante de ingresos */}
      <div className="text-center mb-4">
        <span className="text-4xl font-black text-white tracking-tight">
          {formatCurrency(savings.totalSavings)}
        </span>
        <p className="text-emerald-200/80 text-xs mt-1 font-medium">
          Ahorro total (DelaySpend + Sobrante de ingresos)
        </p>
        {!hasData && savings.closedPeriodsCount === 0 && (
          <p className="text-emerald-300/60 text-[11px] mt-1.5">
            Al cerrar tu primer período, acá verás el dinero total que lograste ahorrar.
          </p>
        )}
      </div>

      {/* Desglose en 2 tarjetas */}
      <div className="flex flex-col gap-2.5">
        {/* 1. Tarjeta interactiva DelaySpend (tocable para ver desglose) */}
        <div
          onClick={() => setIsDelaySpendExpanded(!isDelaySpendExpanded)}
          className="flex flex-col bg-white/10 hover:bg-white/15 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer border border-white/5 hover:border-emerald-400/30 select-none"
          role="button"
          tabIndex={0}
          aria-expanded={isDelaySpendExpanded}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-100 block leading-tight">
                    Ahorro DelaySpend
                  </span>
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                    {isDelaySpendExpanded ? (
                      <>
                        <span>Detalle</span>
                        <ChevronUp className="w-2.5 h-2.5" />
                      </>
                    ) : (
                      <>
                        <span>Tocá para ver</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </>
                    )}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300/70">
                  Compras postergadas + sobreprecios evitados
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-emerald-300 shrink-0 ml-2">
              {formatCurrency(savings.delaySpendSavings)}
            </span>
          </div>

          {/* Desglose desplegable al tocar */}
          {isDelaySpendExpanded && (
            <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-col gap-2">
              {/* Compras no consumadas */}
              <div className="flex items-center justify-between bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <Ban className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-100 text-[11px]">
                      Gasto no consumado directamente
                    </span>
                    <span className="text-[9px] text-emerald-300/60">
                      Compras impulsivas que frenaste y postergaste
                    </span>
                  </div>
                </div>
                <span className="font-black text-emerald-300 text-xs ml-2 shrink-0">
                  {formatCurrency(savings.delaySpendDirect)}
                </span>
              </div>

              {/* Versión más barata */}
              <div className="flex items-center justify-between bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-100 text-[11px]">
                      Ahorro por versión más barata
                    </span>
                    <span className="text-[9px] text-emerald-300/60">
                      Sobreprecio evitado al elegir opciones económicas
                    </span>
                  </div>
                </div>
                <span className="font-black text-teal-300 text-xs ml-2 shrink-0">
                  {formatCurrency(savings.delaySpendCheaper)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Tarjeta Sobrante de Ingresos */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3.5 py-2.5 border border-white/5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-300 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-100 block leading-tight">
                Sobrante de ingresos
              </span>
              <span className="text-[10px] text-emerald-300/70">
                Saldo neto no gastado al cerrar ciclos
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-teal-300 shrink-0 ml-2">
            {formatCurrency(savings.incomeLeftoverSavings)}
          </span>
        </div>
      </div>
    </div>
  );
}
