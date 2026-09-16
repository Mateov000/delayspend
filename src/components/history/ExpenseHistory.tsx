import { useState, useMemo } from 'react';
import { Expense, Period } from '../../store/types';
import { groupExpensesByDate } from '../../utils/date';
import { ExpenseHistoryGroup } from './ExpenseHistoryGroup';
import { EmptyState } from '../ui/EmptyState';
import { STRINGS } from '../../constants/strings';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { ArrowDownLeft, Tag, X } from 'lucide-react';

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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Tags disponibles en la lista actual de gastos
  const availableTags = useMemo(() => {
    return Array.from(new Set(expenses.flatMap((e) => e.tags ?? []))).sort();
  }, [expenses]);

  // Filtrado reactivo por tag seleccionado
  const displayedExpenses = useMemo(() => {
    if (!selectedTag) return expenses;
    return expenses.filter((e) => e.tags?.includes(selectedTag));
  }, [expenses, selectedTag]);

  const groups = groupExpensesByDate(displayedExpenses);
  const showIncomeMilestone = Boolean(period && period.initialIncome > 0 && !selectedTag);

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800">
          {STRINGS.HISTORY_TITLE}
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {displayedExpenses.length} {displayedExpenses.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Filtro de etiquetas horizontales (sólo visible si hay gastos con tags) */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {availableTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
                {isSelected && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

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
