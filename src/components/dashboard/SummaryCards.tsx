import { FinancialMetrics } from '../../store/types';
import { STRINGS } from '../../constants/strings';
import { MetricCard } from './MetricCard';
import { TransferActionCard } from './TransferActionCard';
import { TrendingDown, ShieldCheck, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface SummaryCardsProps {
  metrics: FinancialMetrics;
  onTransferClick: () => void;
}

export function SummaryCards({ metrics, onTransferClick }: SummaryCardsProps) {
  const hasIncome = metrics.initialIncome > 0;

  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Métrica Estrella al frente para impacto conductual */}
      <TransferActionCard
        pendingAmount={metrics.pendingTransfer}
        onTransferClick={onTransferClick}
      />

      {/* 2. Grid de Total Gastado vs Total Guardado */}
      {/* 2. Tarjeta de Ingreso Asignado y Saldo Remanente del Período */}
      {hasIncome && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                  {STRINGS.PERIOD_CARD_INCOME_TITLE}
                </span>
                <span className="text-base font-extrabold text-white">
                  {formatCurrency(metrics.initialIncome)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                {STRINGS.PERIOD_CARD_REMAINING_TITLE}
              </span>
              <span
                className={`text-base font-extrabold ${
                  metrics.remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(metrics.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Barra de distribución del ingreso */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (metrics.totalReal / metrics.initialIncome) * 100))}%`,
              }}
              title={`Gastado: ${formatCurrency(metrics.totalReal)}`}
            />
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100 - Math.min(100, (metrics.totalReal / metrics.initialIncome) * 100),
                  Math.max(0, (metrics.totalDelayed / metrics.initialIncome) * 100)
                )}%`,
              }}
              title={`Ahorrado: ${formatCurrency(metrics.totalDelayed)}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>Gastado real: <strong>{formatCurrency(metrics.totalReal)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>DelaySpend: <strong>{formatCurrency(metrics.totalDelayed)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Grid de Total Gastado vs Total Guardado */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title={STRINGS.METRICS_REAL_TITLE}
          amount={metrics.totalReal}
          subtitle={STRINGS.METRICS_REAL_SUBTITLE}
          icon={<TrendingDown className="w-4 h-4" />}
          variant="real"
        />

        <MetricCard
          title={STRINGS.METRICS_DELAYED_TITLE}
          amount={metrics.totalDelayed}
          subtitle={STRINGS.METRICS_DELAYED_SUBTITLE}
          icon={<ShieldCheck className="w-4 h-4" />}
          variant="delayed"
        />
      </div>

      {/* 3. Indicador sutil de total rendido (ideal para padres) */}
      {/* 4. Indicador sutil de total rendido (ideal para padres) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100/80 rounded-xl border border-slate-200/50 text-xs">
        <span className="font-semibold text-slate-500">
          {STRINGS.METRICS_ACCOUNTED_LABEL}
        </span>
        <span className="font-bold text-slate-800">
          {formatCurrency(metrics.totalAccounted)}
        </span>
      </div>
    </div>
  );
}

