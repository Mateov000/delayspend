import { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/format';

interface MetricCardProps {
  title: string;
  amount: number;
  subtitle: string;
  icon: ReactNode;
  variant: 'real' | 'delayed';
}

export function MetricCard({
  title,
  amount,
  subtitle,
  icon,
  variant,
}: MetricCardProps) {
  const colorStyles = {
    real: {
      border: 'border-rose-100',
      iconBg: 'bg-rose-100 text-rose-700',
      amountText: 'text-rose-700',
    },
    delayed: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-700',
      amountText: 'text-emerald-700',
    },
  }[variant];

  return (
    <Card className={`p-4 border ${colorStyles.border} flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${colorStyles.iconBg}`}>
          {icon}
        </div>
      </div>

      <div>
        <div className={`text-2xl font-extrabold tracking-tight ${colorStyles.amountText}`}>
          {formatCurrency(amount)}
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">
          {subtitle}
        </p>
      </div>
    </Card>
  );
}

