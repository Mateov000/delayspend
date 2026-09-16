import { useState, FormEvent, ChangeEvent } from 'react';
import { ExpenseInput, ExpenseType, ExpenseNature, CategoryId } from '../../store/types';
import { useCategoryStore, getAllCategories } from '../../store/useCategoryStore';
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
  TrendingUp,
  PiggyBank,
  X,
  CreditCard,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  ShoppingBag,
  Home,
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
  const { customCategories } = useCategoryStore();
  const allCategories = getAllCategories(customCategories);

  // Estado principal del formulario
  const [type, setType] = useState<ExpenseType>(initialValues?.type ?? 'real');
  const [amountStr, setAmountStr] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ''
  );
  const [description, setDescription] = useState<string>(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(initialValues?.categoryId ?? 'food');
  const [date, setDate] = useState<string>(initialValues?.date ?? todayStr);

  // Opción más barata / sobreprecio evitado (solo en real)
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

  // Cuotas (solo en real)
  const [hasInstallments, setHasInstallments] = useState<boolean>(
    Boolean(initialValues?.installmentTotal && initialValues.installmentTotal > 1)
  );

  // Naturaleza del gasto (solo en gastos reales: cotidiano, fijo o eventual)
  const initialNature: ExpenseNature =
    initialValues?.nature ?? (initialValues?.isRecurring ? 'fixed' : 'daily');
  const [nature, setNature] = useState<ExpenseNature>(initialNature);
  const [installmentCount, setInstallmentCount] = useState<number>(
    initialValues?.installmentTotal ?? 2
  );

  // Todos los tags usados previamente (para autocomplete)
  const allUsedTags = Array.from(
    new Set(expenses.flatMap((e) => e.tags ?? []))
  ).sort();

  // Control de presupuesto por categoría (solo aplica a gastos reales)
  const categoryBudget = getBudgetForCategory(categoryId);
  const currentCategorySpent = getSpentForCategory(expenses, categoryId);
  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;
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
      showToast(
        type === 'income' ? 'Ingresá el motivo o concepto del ingreso.' : STRINGS.TOAST_ERROR_NO_DESCRIPTION,
        'error'
      );
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
      categoryId: type === 'income' ? 'other' : categoryId,
      date: date || todayStr,
      savedExtraAmount: cleanSavedExtra,
      periodId: initialValues?.periodId,
      tags: tags.length > 0 ? tags : undefined,
      installmentGroupId: type === 'real' && hasInstallments ? (initialValues?.installmentGroupId ?? null) : null,
      installmentNumber: type === 'real' && hasInstallments ? (initialValues?.installmentNumber ?? 1) : null,
      installmentTotal: type === 'real' && hasInstallments ? installmentCount : null,
      isRecurring: type === 'real' && nature === 'fixed' ? true : undefined,
      nature: type === 'real' ? nature : undefined,
    });
  };

  const selectedCategoryObj = allCategories.find((c) => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 1. Selector de Tipo (Segmented Control 3 opciones) */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('real')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-semibold transition-all cursor-pointer ${
              type === 'real'
                ? 'bg-white text-rose-700 shadow-sm border border-rose-100'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Gasto Real</span>
            </div>
            <span className="text-[9px] text-slate-400 font-normal">Plata que salió</span>
          </button>

          <button
            type="button"
            onClick={() => setType('delayed')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-semibold transition-all cursor-pointer ${
              type === 'delayed'
                ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100 ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">DelaySpend</span>
            </div>
            <span className="text-[9px] text-slate-400 font-normal">Plata ahorrada</span>
          </button>

          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-semibold transition-all cursor-pointer ${
              type === 'income'
                ? 'bg-white text-teal-700 shadow-sm border border-teal-100 ring-2 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Ingreso Extra</span>
            </div>
            <span className="text-[9px] text-slate-400 font-normal">Suma al período</span>
          </button>
        </div>
      </div>

      {/* 2. Display de Monto Gigante */}
      <div className="flex flex-col items-center justify-center py-2 border-b border-slate-100">
        <label
          htmlFor="expense-amount"
          className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
        >
          {type === 'income' ? 'Monto del Ingreso Extra' : STRINGS.FORM_AMOUNT_LABEL}
        </label>
        <div className="flex items-center justify-center text-slate-900 w-full">
          <span
            className={`text-4xl font-extrabold mr-1 ${
              type === 'real'
                ? 'text-rose-600'
                : type === 'delayed'
                ? 'text-emerald-600'
                : 'text-teal-600'
            }`}
          >
            {type === 'income' ? '+$' : '$'}
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

        {/* Advertencia de presupuesto superado (solo para gastos reales) */}
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

      {/* 3. Opción más barata / Ahorro extra DelaySpend (solo en real) */}
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

      {/* 4. Selector de Categorías (solo para gastos reales y delayeadas) */}
      {type !== 'income' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {STRINGS.FORM_CATEGORY_LABEL}
          </label>
          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1">
            {allCategories.map((cat) => {
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
      )}

      {/* 5. Campo de Detalle / Concepto */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expense-desc"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {type === 'income' ? 'Concepto o Motivo del Ingreso' : STRINGS.FORM_DESCRIPTION_LABEL}
        </label>
        <input
          id="expense-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            type === 'income'
              ? 'Ej: Transferencia de mamá, Cobro freelance, Bono...'
              : STRINGS.FORM_DESCRIPTION_PLACEHOLDER
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* 6. Selector de Fecha */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expense-date"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          {type === 'income' ? 'Fecha del Ingreso' : STRINGS.FORM_DATE_LABEL}
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

      {/* Selector de Naturaleza de Gasto: Cotidiano / Fijo / Eventual / Para la casa (solo en gastos reales) */}
      {type === 'real' && (
        <div className="flex flex-col gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Naturaleza del Gasto
            </label>
            <span className="text-[10px] text-slate-500 font-medium">
              {nature === 'daily' && 'Impacta en el ritmo de consumo diario'}
              {nature === 'fixed' && 'No afecta ritmo diario · Compromiso mensual'}
              {nature === 'eventual' && 'Gasto esporádico/personal · Aislado de ritmo'}
              {nature === 'house' && 'Compras para el hogar · Detallado a padres'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setNature('daily')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                nature === 'daily'
                  ? 'bg-white text-emerald-700 border-emerald-300 shadow-xs ring-2 ring-emerald-400/20'
                  : 'bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cotidiano</span>
              </div>
              <span className="text-[9px] font-normal text-slate-600 leading-tight">Super, salidas, comida</span>
            </button>

            <button
              type="button"
              onClick={() => setNature('fixed')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                nature === 'fixed'
                  ? 'bg-white text-indigo-700 border-indigo-300 shadow-xs ring-2 ring-indigo-400/20'
                  : 'bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fijo</span>
              </div>
              <span className="text-[9px] font-normal text-slate-600 leading-tight">Alquiler, abonos</span>
            </button>

            <button
              type="button"
              onClick={() => setNature('eventual')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                nature === 'eventual'
                  ? 'bg-white text-amber-700 border-amber-300 shadow-xs ring-2 ring-amber-400/20'
                  : 'bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Eventual</span>
              </div>
              <span className="text-[9px] font-normal text-slate-600 leading-tight">Peluquería, salud</span>
            </button>

            <button
              type="button"
              onClick={() => setNature('house')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                nature === 'house'
                  ? 'bg-white text-purple-700 border-purple-300 shadow-xs ring-2 ring-purple-400/20'
                  : 'bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Home className="w-3.5 h-3.5 text-purple-600" />
                <span>Para la casa</span>
              </div>
              <span className="text-[9px] font-normal text-slate-600 leading-tight">Familia, artículos hogar</span>
            </button>
          </div>
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
          variant={type === 'income' ? 'primary' : type === 'delayed' ? 'delayed' : 'primary'}
          size="lg"
          fullWidth
          className={type === 'income' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
        >
          {isEditing
            ? STRINGS.FORM_SUBMIT_EDIT
            : type === 'income'
            ? 'Registrar Ingreso Extra'
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
