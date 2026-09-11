import { Expense } from '../../store/types';
import { groupExpensesByDate } from '../../utils/date';
import { ExpenseHistoryGroup } from './ExpenseHistoryGroup';
import { EmptyState } from '../ui/EmptyState';
import { STRINGS } from '../../constants/strings';

interface ExpenseHistoryProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onToggleTransfer: (id: string) => void;
}

export function ExpenseHistory({
  expenses,
  onEdit,
  onDelete,
  onToggleTransfer,
}: ExpenseHistoryProps) {
  const groups = groupExpensesByDate(expenses);

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
            />
          ))}
        </div>
      )}
    </div>
  );
}

