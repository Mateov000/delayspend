import { useState, FormEvent, ChangeEvent } from 'react';
import { ExpenseInput, ExpenseType, CategoryId } from '../../store/types';
import { CATEGORIES } from '../../constants/categories';
import { STRINGS } from '../../constants/strings';
import { useToastStore } from '../../store/useToastStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { getSpentForCategory } from '../../utils/budgetMetrics';
import { formatCurrency } from '../../utils/format';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Button } from '../ui/Button';
import { TagInput } from './TagInput';
import {
  ArrowDownLeft,
  ShieldCheck,
  PiggyBank,
  X,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';

interface ExpenseFormProps {
  initialValues?: ExpenseInput;
  isEditing?: boolean;
  onSubmit: (data: ExpenseInput) => void;
  onCancel: () => void;
}

export function ExpenseForm({
  initialValues,
  isEditing = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { showToast } = useToastStore();
  const { expenses } = useExpenseStore();
  const { getBudgetForCategory } = useBudgetStore();

  const todayStr = new Date().toISOString().split('T')[0] ?? '';

  // Estado principal del formulario
  const [type, setType] = useState<ExpenseType>(initialValues?.type ?? 'real');
  const [amountStr, setAmountStr] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ''
  );
  const [description, setDescription] = useState<string>(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(initialValues?.categoryId ?? 'food');
  const [date, setDate] = useState<string>(initialValues?.date ?? todayStr);

  // Opción más barata / sobreprecio evitado
  const [hasCheaperOption, setHasCheaperOption] = useState<boolean>(
    Boolean(initialValues?.savedExtraAmount && initialValues.savedExtraAmount > 0)
  );
  const [cheaperSavingsStr, setCheaperSavingsStr] = useState<string>(
    initialValues?.savedExtraAmount ? String(initialValues.savedExtraAmount) : ''
  );

  // Tags
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(
    Boolean(initialValues?.tags && initialValues.tags.length > 0)
  );

  // Cuotas
  const [hasInstallments, setHasInstallments] = useState<boolean>(
    Boolean(initialValues?.installmentTotal && initialValues.installmentTotal > 1)
  );
  const [installmentCount, setInstallmentCount] = useState<number>(
    initialValues?.installmentTotal ?? 2
  );

  // Todos los tags usados previamente (para autocomplete)
  const allUsedTags = Array.from(
    new Set(expenses.flatMap((e) => e.tags ?? []))
  ).sort();

  // Control de presupuesto por categoría
  const categoryBudget = getBudgetForCategory(categoryId);
  const currentCategorySpent = getSpentForCategory(expenses, categoryId);
  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  // Si estamos editando, descontamos el monto previo de este gasto
  const previousAmount = isEditing && initialValues ? initialValues.amount : 0;
  const projectedCategorySpent = currentCategorySpent - previousAmount + parsedAmount;
  const isBudgetExceeded =
    type === 'real' && categoryBudget > 0 && projectedCategorySpent > categoryBudget;

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    setAmountStr(val);
  };

  const handleRemoveSavings = () => {
    setHasCheaperOption(false);
    setCheaperSavingsStr('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const cleanAmount = parseFloat(amountStr);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showToast(STRINGS.TOAST_ERROR_INVALID_AMOUNT, 'error');
      return;
    }

    if (!description.trim()) {
      showToast(STRINGS.TOAST_ERROR_NO_DESCRIPTION, 'error');
      return;
    }

    let cleanSavedExtra: number | null = null;
    if (type === 'real' && hasCheaperOption) {
      const parsedSavings = parseFloat(cheaperSavingsStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!isNaN(parsedSavings) && parsedSavings > 0) {
        cleanSavedExtra = parsedSavings;
      }
    }

    onSubmit({
      type,
      amount: cleanAmount,
      description: description.trim(),
      categoryId,
      date: date || todayStr,
      savedExtraAmount: cleanSavedExtra,
      periodId: initialValues?.periodId,
      tags: tags.length > 0 ? tags : undefined,
      installmentGroupId: hasInstallments ? (initialValues?.installmentGroupId ?? null) : null,
      installmentNumber: hasInstallments ? (initialValues?.installmentNumber ?? 1) : null,
      installmentTotal: hasInstallments ? installmentCount : null,
    });
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 1. Selector de Tipo (Segmented Control Grande) */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('real')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl font-semibold transition-all cursor-pointer ${
              type === 'real'
                ? 'bg-white text-rose-700 shadow-sm border border-rose-100'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4" />
              <span className="text-sm">{STRINGS.FORM_TYPE_REAL}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {STRINGS.FORM_TYPE_REAL_DESC}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setType('delayed')}
            className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl font-semibold transition-all cursor-pointer ${
              type === 'delayed'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100 ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">{STRINGS.FORM_TYPE_DELAYED}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              {STRINGS.FORM_TYPE_DELAYED_DESC}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Display de Monto Gigante */}
      <div className="flex flex-col items-center justify-center py-2 border-b border-slate-100">
        <label
          htmlFor="expense-amount"
          className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
        >
          {STRINGS.FORM_AMOUNT_LABEL}
        </label>
        <div className="flex items-center justify-center text-slate-900 w-full">
          <span
            className={`text-4xl font-extrabold mr-1 ${
              type === 'real' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            $
          </span>
          <input
            id="expense-amount"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            autoFocus
            value={amountStr}
            onChange={handleAmountChange}
            placeholder={STRINGS.FORM_AMOUNT_PLACEHOLDER}
            className="w-full text-center text-4xl font-extrabold bg-transparent focus:outline-none placeholder:text-slate-300"
          />
        </div>

        {/* Advertencia de presupuesto superado */}
        {isBudgetExceeded && (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-medium mt-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Superarías el límite de {selectedCategoryObj?.name ?? 'esta categoría'} (
              {formatCurrency(categoryBudget)})
            </span>
          </div>
        )}
      </div>

      {/* 3. Opción más barata / Ahorro extra DelaySpend */}
      {type === 'real' && (
        <div className="flex flex-col gap-3 p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl shadow-2xs">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              if (hasCheaperOption) {
                handleRemoveSavings();
              } else {
                setHasCheaperOption(true);
              }
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300/80 text-emerald-700 flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  {STRINGS.FORM_CHEAPER_OPTION_TOGGLE}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-snug">
                  {STRINGS.FORM_CHEAPER_OPTION_SUBTITLE}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={hasCheaperOption}
              onClick={(e) => {
                e.stopPropagation();
                if (hasCheaperOption) {
                  handleRemoveSavings();
                } else {
                  setHasCheaperOption(true);
                }
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hasCheaperOption ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  hasCheaperOption ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {hasCheaperOption && (
            <div className="flex flex-col gap-2 pt-2.5 border-t border-emerald-200/70">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="cheaper-savings"
                  className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider"
                >
                  {STRINGS.FORM_CHEAPER_SAVINGS_LABEL}
                </label>
                <button
                  type="button"
                  onClick={handleRemoveSavings}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                  title="Quitar sobreprecio"
                >
                  <X className="w-3 h-3" />
                  <span>Quitar sobreprecio</span>
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">
                  $
                </span>
                <input
                  id="cheaper-savings"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 2.500"
                  value={cheaperSavingsStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, '');
                    setCheaperSavingsStr(val);
                  }}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-emerald-950 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <span className="text-[10px] text-emerald-700 font-medium leading-tight">
                {STRINGS.FORM_CHEAPER_SAVINGS_HINT}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 4. Selector de Categorías (Cuadrícula táctil) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {STRINGS.FORM_CATEGORY_LABEL}
        </label>
        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
          {CATEGORIES.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400 ring-offset-1'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <CategoryIcon name={cat.icon} className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight line-clamp-1">
                  {cat.name.split('&')[0]?.trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Campo de Detalle / Concepto */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expense-desc"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {STRINGS.FORM_DESCRIPTION_LABEL}
        </label>
        <input
          id="expense-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={STRINGS.FORM_DESCRIPTION_PLACEHOLDER}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* 6. Selector de Fecha */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expense-date"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {STRINGS.FORM_DATE_LABEL}
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* 7. Cuotas (solo en nuevos gastos reales) */}
      {type === 'real' && !isEditing && (
        <div className="flex flex-col gap-2 p-3 bg-sky-50/80 border border-sky-200/70 rounded-2xl">
          <div
            onClick={() => setHasInstallments(!hasInstallments)}
            className="flex items-center justify-between cursor-pointer w-full"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">Pagar en cuotas</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Generá cuotas futuras automáticamente
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasInstallments}
              onClick={(e) => {
                e.stopPropagation();
                setHasInstallments(!hasInstallments);
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hasInstallments ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  hasInstallments ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {hasInstallments && (
            <div className="flex items-center gap-3 pt-2.5 border-t border-sky-200/70">
              <label className="text-[11px] font-bold text-sky-800 uppercase tracking-wider shrink-0">
                Cantidad de cuotas
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setInstallmentCount(Math.max(2, installmentCount - 1))}
                  className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold cursor-pointer hover:bg-sky-200 transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-slate-800 text-sm">
                  {installmentCount}
                </span>
                <button
                  type="button"
                  onClick={() => setInstallmentCount(Math.min(36, installmentCount + 1))}
                  className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold cursor-pointer hover:bg-sky-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {hasInstallments && amountStr && !isNaN(parseFloat(amountStr)) && (
            <p className="text-[10px] text-sky-700 font-medium">
              Monto por cuota:{' '}
              <strong>
                ${(parseFloat(amountStr.replace(',', '.')) / installmentCount).toFixed(0)}
              </strong>{' '}
              · Se crearán {installmentCount - 1} cuota{installmentCount - 1 !== 1 ? 's' : ''} futura{installmentCount - 1 !== 1 ? 's' : ''} como Delayeadas.
            </p>
          )}
        </div>
      )}

      {/* 8. Etiquetas (colapsable) */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsTagsExpanded(!isTagsExpanded)}
          className="flex items-center justify-between cursor-pointer w-full px-0.5"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            🏷️ Etiquetas
            {tags.length > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                {tags.length}
              </span>
            )}
          </span>
          {isTagsExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isTagsExpanded && (
          <TagInput
            tags={tags}
            onChange={setTags}
            suggestions={allUsedTags}
          />
        )}
      </div>

      {/* 9. Botones de Acción */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          type="submit"
          variant={type === 'delayed' ? 'delayed' : 'primary'}
          size="lg"
          fullWidth
        >
          {isEditing
            ? STRINGS.FORM_SUBMIT_EDIT
            : type === 'delayed'
            ? STRINGS.FORM_SUBMIT_DELAYED
            : STRINGS.FORM_SUBMIT_REAL}
        </Button>
        <Button type="button" variant="ghost" size="md" fullWidth onClick={onCancel}>
          {STRINGS.FORM_CANCEL}
        </Button>
      </div>
    </form>
  );
}
