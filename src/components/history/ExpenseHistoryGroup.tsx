import { ExpenseGroup } from '../../utils/date';
import { Expense } from '../../store/types';
import { ExpenseListItem } from './ExpenseListItem';
import { formatCurrency } from '../../utils/format';

interface ExpenseHistoryGroupProps {
  group: ExpenseGroup;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onToggleTransfer: (id: string) => void;
  onCutoffFromHere?: (expense: Expense) => void;
}

export function ExpenseHistoryGroup({
  group,
  onEdit,
  onDelete,
  onToggleTransfer,
  onCutoffFromHere,
}: ExpenseHistoryGroupProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Group Header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {group.displayDate}
        </span>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
          {group.subtotalReal > 0 && (
            <span className="text-rose-600 font-bold">
              -{formatCurrency(group.subtotalReal)}
            </span>
          )}
          {group.subtotalDelayed > 0 && (
            <span className="text-emerald-600 font-bold">
              +{formatCurrency(group.subtotalDelayed)}
            </span>
          )}
        </div>
      </div>

      {/* Group Items */}
      <div className="flex flex-col gap-2">
        {group.items.map((expense) => (
          <ExpenseListItem
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleTransfer={onToggleTransfer}
            onCutoffFromHere={onCutoffFromHere}
          />
        ))}
      </div>
    </div>
  );
}

