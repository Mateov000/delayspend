import { useState, FormEvent, useEffect } from 'react';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Calendar, DollarSign, Tag, Trash2 } from 'lucide-react';
import { Period } from '../../store/types';

interface EditPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period | null;
  onDeleteRequest?: (periodId: string) => void;
}

export function EditPeriodModal({
  isOpen,
  onClose,
  period,
  onDeleteRequest,
}: EditPeriodModalProps) {
  const { updatePeriod } = usePeriodStore();
  const { showToast } = useToastStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [incomeStr, setIncomeStr] = useState('');

  useEffect(() => {
    if (period) {
      setName(period.name);
      setStartDate(period.startDate);
      setEndDate(period.endDate || '');
      setIncomeStr(period.initialIncome > 0 ? String(period.initialIncome) : '');
    }
  }, [period, isOpen]);

  if (!period) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const cleanIncome = parseFloat(incomeStr.replace(/\./g, '').replace(',', '.')) || 0;

    updatePeriod(period.id, {
      name: name.trim() || period.name,
      startDate,
      endDate: endDate || null,
      initialIncome: cleanIncome,
    });

    showToast(STRINGS.TOAST_PERIOD_UPDATED, 'success');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={STRINGS.PERIOD_MODAL_EDIT_TITLE}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          {STRINGS.PERIOD_MODAL_EDIT_SUBTITLE}
        </p>

        {/* Nombre del Período */}
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Ingreso Asignado */}
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
              value={incomeStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.,]/g, '');
                setIncomeStr(val);
              }}
              placeholder="0"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            />
          </div>
        </div>

        {/* Rango de Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Desde</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hasta {period.endDate === null && '(Abierto)'}</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Presente"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
          >
            {STRINGS.PERIOD_SUBMIT_EDIT}
          </Button>

          {onDeleteRequest && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteRequest(period.id);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold py-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar este período</span>
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}
