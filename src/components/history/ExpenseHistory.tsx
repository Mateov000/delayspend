import { Expense, Period } from '../../store/types';
import { groupExpensesByDate } from '../../utils/date';
import { ExpenseHistoryGroup } from './ExpenseHistoryGroup';
import { EmptyState } from '../ui/EmptyState';
import { STRINGS } from '../../constants/strings';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { ArrowDownLeft } from 'lucide-react';

interface ExpenseHistoryProps {
  expenses: Expense[];
  period?: Period | null;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onToggleTransfer: (id: string) => void;
  onCutoffFromHere?: (expense: Expense) => void;
}

export function ExpenseHistory({
  expenses,
  period,
  onEdit,
  onDelete,
  onToggleTransfer,
  onCutoffFromHere,
}: ExpenseHistoryProps) {
  const groups = groupExpensesByDate(expenses);
  const showIncomeMilestone = Boolean(period && period.initialIncome > 0);

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800">
          {STRINGS.HISTORY_TITLE}
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {expenses.length} {expenses.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Tarjeta hito de ingreso inicial asignado al ciclo */}
      {showIncomeMilestone && period && (
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800">
                {STRINGS.PERIOD_HISTORY_INCOME_TITLE}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {formatDayMonth(period.startDate)} • Asignación del período
              </span>
            </div>
          </div>
          <span className="font-black text-emerald-700 text-sm">
            +{formatCurrency(period.initialIncome)}
          </span>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <ExpenseHistoryGroup
              key={group.date}
              group={group}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleTransfer={onToggleTransfer}
              onCutoffFromHere={onCutoffFromHere}
            />
          ))}
        </div>
      )}
    </div>
  );
}

