import { useState, FormEvent, useEffect } from 'react';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Calendar, DollarSign, Tag, Sparkles } from 'lucide-react';
import { Period } from '../../store/types';

interface NewPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (period: Period) => void;
}

export function NewPeriodModal({ isOpen, onClose, onCreated }: NewPeriodModalProps) {
  const { periods, createCutoff } = usePeriodStore();
  const { showToast } = useToastStore();

  const today = new Date().toISOString().split('T')[0]!;
  const [startDate, setStartDate] = useState(today);
  const [name, setName] = useState('');
  const [incomeStr, setIncomeStr] = useState('');

  // Auto-sugerir nombre cuando se abre
  useEffect(() => {
    if (isOpen) {
      const nextNum = periods.length + 1;
      setName(`Período ${nextNum}`);
      setStartDate(new Date().toISOString().split('T')[0]!);
      setIncomeStr('');
    }
  }, [isOpen, periods.length]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const cleanIncome = parseFloat(incomeStr.replace(/\./g, '').replace(',', '.')) || 0;

    const newPeriod = createCutoff({
      name: name.trim() || undefined,
      startDate,
      initialIncome: cleanIncome,
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

        {/* Campo Fecha de Inicio */}
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
        </div>

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
