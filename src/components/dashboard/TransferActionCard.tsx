import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { STRINGS } from '../../constants/strings';
import { formatCurrency } from '../../utils/format';
import { ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface TransferActionCardProps {
  pendingAmount: number;
  onTransferClick: () => void;
}

export function TransferActionCard({
  pendingAmount,
  onTransferClick,
}: TransferActionCardProps) {
  const isPending = pendingAmount > 0;

  return (
    <Card
      variant="highlight"
      className="p-5 border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 shadow-sm relative overflow-hidden"
    >
      {/* Decorative background circle */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-300">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
              {STRINGS.METRICS_TRANSFER_TITLE}
            </span>
            <span className="text-[11px] text-indigo-700/80 font-medium">
              {STRINGS.METRICS_TRANSFER_SUBTITLE}
            </span>
          </div>
        </div>
      </div>

      <div className="my-3">
        <div className="text-3xl sm:text-4xl font-black text-indigo-950 tracking-tight">
          {formatCurrency(pendingAmount)}
        </div>
      </div>

      {isPending ? (
        <div className="mt-4 pt-3 border-t border-indigo-100 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={onTransferClick}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md shadow-indigo-300/50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{STRINGS.METRICS_TRANSFER_ACTION}</span>
          </Button>
          <p className="text-[11px] text-center text-indigo-600/80 font-medium">
            Mové esta plata a tu cuenta remunerada o plazo fijo.
          </p>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-indigo-100/60 flex items-center gap-2 text-emerald-700 bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-200/60">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="text-xs font-bold">
            {STRINGS.METRICS_TRANSFER_SUCCESS}
          </span>
        </div>
      )}
    </Card>
  );
}

