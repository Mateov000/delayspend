import { FinancialMetrics } from '../../store/types';
import { STRINGS } from '../../constants/strings';
import { MetricCard } from './MetricCard';
import { TransferActionCard } from './TransferActionCard';
import { TrendingDown, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface SummaryCardsProps {
  metrics: FinancialMetrics;
  onTransferClick: () => void;
}

export function SummaryCards({ metrics, onTransferClick }: SummaryCardsProps) {
  return (
    <div className="flex flex-col gap-3.5">
      {/* 1. Métrica Estrella al frente para impacto conductual */}
      <TransferActionCard
        pendingAmount={metrics.pendingTransfer}
        onTransferClick={onTransferClick}
      />

      {/* 2. Grid de Total Gastado vs Total Guardado */}
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

