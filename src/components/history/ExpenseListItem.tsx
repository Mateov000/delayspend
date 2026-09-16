import { useState } from 'react';
import { Expense } from '../../store/types';
import { getCategoryById } from '../../constants/categories';
import { STRINGS } from '../../constants/strings';
import { formatCurrency } from '../../utils/format';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Badge } from '../ui/Badge';
import { Tag, MoreVertical, Edit2, Trash2, CheckCircle, RotateCcw, Scissors } from 'lucide-react';

interface ExpenseListItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onToggleTransfer: (id: string) => void;
  onCutoffFromHere?: (expense: Expense) => void;
}

export function ExpenseListItem({
  expense,
  onEdit,
  onDelete,
  onToggleTransfer,
  onCutoffFromHere,
}: ExpenseListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const category = getCategoryById(expense.categoryId);
  const isReal = expense.type === 'real';
  const isTransferred = Boolean(expense.transferredAt);
  const hasCheaperSavings = Boolean(isReal && expense.savedExtraAmount && expense.savedExtraAmount > 0);
  const canTransfer = !isReal || hasCheaperSavings;
  const hasInstallments = Boolean(
    expense.installmentGroupId && expense.installmentTotal && expense.installmentTotal > 1
  );
  const hasTags = Boolean(expense.tags && expense.tags.length > 0);

  return (
    <div className="relative flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-colors">
      {/* Left: Category Icon & Details */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${category.badgeBg} ${category.textColor}`}
        >
          <CategoryIcon name={category.icon} className="w-5 h-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-slate-800 truncate leading-tight">
            {expense.description}
          </span>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400">{category.name}</span>

            <span className="text-slate-300">•</span>

            <Badge variant={isReal ? 'real' : 'delayed'} size="sm">
              {isReal ? STRINGS.HISTORY_BADGE_REAL : STRINGS.HISTORY_BADGE_DELAYED}
            </Badge>

            {/* Cuota badge */}
            {hasInstallments && expense.installmentNumber && expense.installmentTotal && (
              <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200/80 font-bold px-1.5 py-0.5 rounded-md">
                💳 Cuota {expense.installmentNumber}/{expense.installmentTotal}
              </span>
            )}

            {/* Ahorro opción más barata */}
            {hasCheaperSavings && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <span>💡 {STRINGS.HISTORY_BADGE_SAVINGS_EXTRA}</span>
                <span>{formatCurrency(expense.savedExtraAmount!)}</span>
              </span>
            )}

            {/* Transfer status badge */}
            {canTransfer && (
              <button
                type="button"
                onClick={() => onToggleTransfer(expense.id)}
                className="cursor-pointer"
                title={
                  isTransferred
                    ? STRINGS.HISTORY_ACTION_UNMARK_TRANSFERRED
                    : STRINGS.HISTORY_ACTION_MARK_TRANSFERRED
                }
              >
                <Badge
                  variant={isTransferred ? 'transferred' : 'neutral'}
                  size="sm"
                  className="hover:opacity-80 transition-opacity"
                >
                  {isTransferred ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-teal-600" />
                      <span>{hasCheaperSavings ? 'Ahorro transferido' : 'Transferido'}</span>
                    </>
                  ) : (
                    <span>{hasCheaperSavings ? '⏳ Ahorro pendiente' : '⏳ Pendiente'}</span>
                  )}
                </Badge>
              </button>
            )}
          </div>

          {/* Tags row */}
          {hasTags && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {expense.tags!.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium"
                >
                  <Tag className="w-2 h-2" />
                  {tag}
                </span>
              ))}
              {expense.tags!.length > 4 && (
                <span className="text-[10px] text-slate-400">+{expense.tags!.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Amount & Action Menu Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-end">
          <span
            className={`text-base font-bold tracking-tight ${
              isReal ? 'text-slate-900' : 'text-emerald-700 font-extrabold'
            }`}
          >
            {isReal ? '-' : '+'}
            {formatCurrency(expense.amount)}
          </span>
          {hasCheaperSavings && (
            <span className="text-[10px] text-emerald-600 font-bold">
              +{formatCurrency(expense.savedExtraAmount!)} ahorro
            </span>
          )}
        </div>

        {/* Botón de Menú Rápido (3 puntos) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            title="Opciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Menú Flotante */}
          {showMenu && (
            <>
              {/* Backdrop for closing menu */}
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />

              <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(expense);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{STRINGS.HISTORY_ACTION_EDIT}</span>
                </button>

                {onCutoffFromHere && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onCutoffFromHere(expense);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-indigo-700 hover:bg-indigo-50 font-medium transition-colors cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{STRINGS.HISTORY_ACTION_CUTOFF_FROM_HERE}</span>
                  </button>
                )}

                {canTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onToggleTransfer(expense.id);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isTransferred
                        ? STRINGS.HISTORY_ACTION_UNMARK_TRANSFERRED
                        : STRINGS.HISTORY_ACTION_MARK_TRANSFERRED}
                    </span>
                  </button>
                )}

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(expense.id);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{STRINGS.HISTORY_ACTION_DELETE}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
