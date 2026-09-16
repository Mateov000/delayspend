import { ShieldCheck, TrendingUp, PiggyBank } from 'lucide-react';
import { HistoricalSavings } from '../../utils/historicalSavings';
import { formatCurrency } from '../../utils/format';

interface HistoricalSavingsCardProps {
  savings: HistoricalSavings;
}

export function HistoricalSavingsCard({ savings }: HistoricalSavingsCardProps) {
  const hasData = savings.delaySpendSavings > 0 || savings.incomeLeftoverSavings > 0;

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
            {savings.periodsCount > 0
              ? `A lo largo de ${savings.periodsCount} período${savings.periodsCount !== 1 ? 's' : ''} cerrado${savings.periodsCount !== 1 ? 's' : ''}`
              : 'Historial completo'}
          </p>
        </div>
      </div>

      {/* Monto total */}
      <div className="text-center mb-4">
        <span className="text-4xl font-black text-white tracking-tight">
          {formatCurrency(savings.totalSavings)}
        </span>
        {!hasData && (
          <p className="text-emerald-300/70 text-xs mt-1">
            Todavía no hay ahorro acumulado. ¡Empezá a delayear!
          </p>
        )}
      </div>

      {/* Desglose */}
      <div className="flex flex-col gap-2">
        {/* DelaySpend savings */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-emerald-100 block leading-tight">
                Ahorro DelaySpend
              </span>
              <span className="text-[10px] text-emerald-300/70">
                Compras postergadas + opciones más baratas
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-emerald-300 shrink-0 ml-2">
            {formatCurrency(savings.delaySpendSavings)}
          </span>
        </div>

        {/* Income leftover savings */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-300 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-emerald-100 block leading-tight">
                Sobrante de ingresos
              </span>
              <span className="text-[10px] text-emerald-300/70">
                Saldo positivo al cerrar períodos
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

