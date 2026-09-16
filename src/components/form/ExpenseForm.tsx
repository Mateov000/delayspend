import { useState, FormEvent, ChangeEvent } from 'react';
import { ExpenseInput, ExpenseType, CategoryId } from '../../store/types';
import { CATEGORIES } from '../../constants/categories';
import { STRINGS } from '../../constants/strings';
import { useToastStore } from '../../store/useToastStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import { Button } from '../ui/Button';
import { ArrowDownLeft, ShieldCheck, PiggyBank } from 'lucide-react';

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

  const todayStr = new Date().toISOString().split('T')[0] ?? '';

  const [type, setType] = useState<ExpenseType>(initialValues?.type ?? 'real');
  const [amountStr, setAmountStr] = useState<string>(
    initialValues?.amount ? String(initialValues.amount) : ''
  );
  const [description, setDescription] = useState<string>(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(initialValues?.categoryId ?? 'food');
  const [date, setDate] = useState<string>(initialValues?.date ?? todayStr);
  const [hasCheaperOption, setHasCheaperOption] = useState<boolean>(
    Boolean(initialValues?.savedExtraAmount && initialValues.savedExtraAmount > 0)
  );
  const [cheaperSavingsStr, setCheaperSavingsStr] = useState<string>(
    initialValues?.savedExtraAmount ? String(initialValues.savedExtraAmount) : ''
  );

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Permite números y una sola coma o punto
    const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    setAmountStr(val);
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

    let cleanSavedExtra: number | undefined = undefined;
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
    });
  };

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
        <label htmlFor="expense-amount" className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {STRINGS.FORM_AMOUNT_LABEL}
        </label>
        <div className="flex items-center justify-center text-slate-900 w-full">
          <span className={`text-4xl font-extrabold mr-1 ${type === 'real' ? 'text-rose-600' : 'text-emerald-600'}`}>
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
      </div>

      {/* 3. Opción más barata / Ahorro extra DelaySpend (Inmediatamente visible bajo el monto) */}
      {type === 'real' ? (
        <div className="flex flex-col gap-3 p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl transition-all shadow-2xs">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setHasCheaperOption(!hasCheaperOption)}
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
                setHasCheaperOption(!hasCheaperOption);
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
            <div className="flex flex-col gap-1.5 pt-2.5 border-t border-emerald-200/70">
              <label htmlFor="cheaper-savings" className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                {STRINGS.FORM_CHEAPER_SAVINGS_LABEL}
              </label>
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
      ) : (
        <button
          type="button"
          onClick={() => setType('real')}
          className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 cursor-pointer text-left transition-colors"
        >
          <PiggyBank className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>¿Elegiste una opción más económica? <strong className="text-rose-600 underline">Cambiá a Gasto Real</strong> para registrar el sobreprecio que te ahorraste.</span>
        </button>
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
        <label htmlFor="expense-desc" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
        <label htmlFor="expense-date" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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

      {/* 7. Botones de Acción */}
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
