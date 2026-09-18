import { useState, FormEvent, useEffect } from 'react';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Calendar, DollarSign, Tag, Sparkles, Scissors, Zap, CheckCircle2 } from 'lucide-react';
import { Period, Expense } from '../../store/types';

interface NewPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (period: Period) => void;
  initialCutoffExpense?: Expense | null;
}

type CutoffMode = 'now' | 'expense' | 'date';

export function NewPeriodModal({
  isOpen,
  onClose,
  onCreated,
  initialCutoffExpense,
}: NewPeriodModalProps) {
  const { periods, createCutoff } = usePeriodStore();
  const { expenses } = useExpenseStore();
  const { showToast } = useToastStore();

  const today = new Date().toISOString().split('T')[0]!;
  const [mode, setMode] = useState<CutoffMode>('now');
  const [startDate, setStartDate] = useState(today);
  const [name, setName] = useState('');
  const [incomeStr, setIncomeStr] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');

  // Auto-sugerir nombre y configurar corte cuando se abre
  useEffect(() => {
    if (isOpen) {
      const activePeriods = periods.filter((p) => !p.deletedAt);
      const nextNum = activePeriods.length + 1;
      setName(`Período ${nextNum}`);
      setIncomeStr('');

      if (initialCutoffExpense) {
        setMode('expense');
        setSelectedExpenseId(initialCutoffExpense.id);
        setStartDate(initialCutoffExpense.date);
      } else {
        setMode('now');
        setSelectedExpenseId('');
        setStartDate(new Date().toISOString().split('T')[0]!);
      }
    }
  }, [isOpen, periods, initialCutoffExpense]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const cleanIncome = parseFloat(incomeStr.replace(/\./g, '').replace(',', '.')) || 0;

    const newPeriod = createCutoff({
      name: name.trim() || undefined,
      startDate: mode === 'date' ? startDate : today,
      initialIncome: cleanIncome,
      cutoffExpenseId: mode === 'expense' ? selectedExpenseId || undefined : undefined,
      mode,
    });

    showToast(STRINGS.TOAST_PERIOD_CREATED, 'success');
    onCreated?.(newPeriod);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={STRINGS.PERIOD_MODAL_NEW_TITLE}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-start gap-2.5 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-950 text-xs leading-relaxed">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <span>{STRINGS.PERIOD_MODAL_NEW_SUBTITLE}</span>
        </div>

        {/* Selector de Modo de Inicio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ¿Cómo querés iniciar este período?
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('now')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'now'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-center sm:text-left">Desde ahora</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('expense')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'expense'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Scissors className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-center sm:text-left">Desde un gasto</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('date')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'date'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-center sm:text-left">Por fecha</span>
            </button>
          </div>
        </div>

        {/* Explicación / Campos condicionales según el modo */}
        {mode === 'now' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Nuevo ciclo limpio a partir de ahora</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                El período anterior se cierra hoy con todos tus gastos hechos hasta el momento. Este nuevo ciclo arranca en <strong>$0</strong> para registrar tus próximas compras.
              </p>
            </div>
          </div>
        )}

        {mode === 'expense' && expenses.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-indigo-500" />
              <span>Primer gasto del nuevo ciclo</span>
            </label>
            <select
              value={selectedExpenseId}
              onChange={(e) => {
                const chosenId = e.target.value;
                setSelectedExpenseId(chosenId);
                if (chosenId) {
                  const exp = expenses.find((x) => x.id === chosenId);
                  if (exp) setStartDate(exp.date);
                }
              }}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccioná qué gasto iniciará el nuevo período...</option>
              {expenses.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {formatDayMonth(exp.date)}: {exp.description} ({formatCurrency(exp.amount)})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedExpenseId
                ? 'El gasto seleccionado y todos los posteriores pertenecerán al nuevo ciclo.'
                : 'Elegí un gasto para que sea el primero del nuevo período.'}
            </span>
          </div>
        )}

        {mode === 'date' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{STRINGS.PERIOD_START_DATE_LABEL}</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <span className="text-[11px] text-slate-500 font-medium">
              Los gastos desde esta fecha en adelante se asignarán al nuevo período.
            </span>
          </div>
        )}

        {/* Campo Ingreso Inicial Asignado */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>{STRINGS.PERIOD_INCOME_LABEL}</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="50.000"
              value={incomeStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setIncomeStr(val);
              }}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {STRINGS.PERIOD_INCOME_HINT}
          </span>
        </div>

        {/* Campo Nombre / Etiqueta del Período */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>{STRINGS.PERIOD_NAME_LABEL}</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={STRINGS.PERIOD_NAME_PLACEHOLDER}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold mt-2 shadow-sm"
        >
          {STRINGS.PERIOD_SUBMIT_NEW}
        </Button>
      </form>
    </BottomSheet>
  );
}
