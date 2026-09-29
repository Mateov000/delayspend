import { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { ExpenseReminder } from '../../store/types';
import {
  calculateRemainingOccurrences,
  calculateAdvanceNextDate,
} from '../../store/useReminderStore';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import {
  FastForward,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
} from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

interface AdvanceReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ExpenseReminder | null;
  onConfirmAdvance: (
    reminder: ExpenseReminder,
    count: number,
    totalAmount: number,
    description: string
  ) => void;
}

export function AdvanceReminderModal({
  isOpen,
  onClose,
  reminder,
  onConfirmAdvance,
}: AdvanceReminderModalProps) {
  const [count, setCount] = useState<number>(1);
  const { showToast } = useToastStore();

  useEffect(() => {
    if (isOpen) {
      setCount(1);
    }
  }, [isOpen, reminder]);

  if (!reminder) return null;

  const remaining = calculateRemainingOccurrences(reminder);
  const isOverRemaining = remaining !== null && count > remaining;
  const isExactRemaining = remaining !== null && count === remaining;

  const { newNextDate, willDeactivate } = calculateAdvanceNextDate(reminder, count);
  const totalAmount = Math.round(reminder.amount * count * 100) / 100;
  const description =
    count > 1 ? `${reminder.title} (próximos ${count})` : reminder.title;

  const getRecurrenceText = () => {
    if (reminder.recurrenceType === 'none') return 'Única vez';
    if (reminder.recurrenceType === 'custom_days') {
      return `Cada ${reminder.recurrenceIntervalDays || 1} días`;
    }
    if (reminder.recurrenceType === 'weekly') return 'Semanal';
    if (reminder.recurrenceType === 'monthly') return 'Mensual';
    return '';
  };

  const handleIncrement = () => {
    setCount((prev) => {
      const next = prev + 1;
      if (remaining !== null && next > remaining) {
        showToast(
          `Solo quedan ${remaining} pago(s) restante(s) en este recordatorio.`,
          'info'
        );
      }
      return next;
    });
  };

  const handleDecrement = () => {
    setCount((prev) => Math.max(1, prev - 1));
  };

  const handleSelectCount = (val: number) => {
    if (remaining !== null && val > remaining) {
      showToast(
        `Solo quedan ${remaining} pago(s) restante(s) en este recordatorio.`,
        'info'
      );
    }
    setCount(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (count <= 0) {
      showToast('La cantidad de pagos a adelantar debe ser al menos 1.', 'error');
      return;
    }

    if (remaining !== null && count > remaining) {
      showToast(
        `No podés adelantar ${count} pagos: solo quedan ${remaining} pago(s) restante(s).`,
        'error'
      );
      return;
    }

    onConfirmAdvance(reminder, count, totalAmount, description);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Adelantar Pago Agendado"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        {/* Tarjeta de estado actual del recordatorio */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recordatorio
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              🔄 {getRecurrenceText()}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-black text-slate-800 truncate">
              {reminder.title}
            </h3>
            <span className="text-sm font-extrabold text-slate-900">
              {formatCurrency(reminder.amount)} / pago
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Próximo agendado:{' '}
              <strong className="text-slate-700">
                {formatDayMonth(reminder.nextDate)}
              </strong>
            </span>
            {remaining !== null ? (
              <span className="font-medium text-amber-800">
                • Quedan {remaining} pago(s)
              </span>
            ) : (
              <span className="font-medium text-slate-400">
                • Repetición continua
              </span>
            )}
          </div>
        </div>

        {/* Selector de cantidad Y */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Cantidad de pagos a adelantar (Y)</span>
            <span className="text-[11px] font-normal text-slate-500">
              Se sumará el monto de cada uno
            </span>
          </label>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={count <= 1}
                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={remaining ?? 999}
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    handleSelectCount(Math.max(1, val));
                  }
                }}
                className="w-14 h-10 text-center font-black text-slate-800 text-base focus:outline-none"
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Accesos rápidos de cantidad */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <button
                type="button"
                onClick={() => handleSelectCount(1)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  count === 1
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1 pago
              </button>
              <button
                type="button"
                onClick={() => handleSelectCount(2)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  count === 2
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleSelectCount(3)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  count === 3
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3
              </button>
              {remaining !== null && remaining > 3 && (
                <button
                  type="button"
                  onClick={() => handleSelectCount(remaining)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    count === remaining
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Todos ({remaining})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notificación de advertencia si intenta adelantar más de los que quedan */}
        {isOverRemaining && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 animate-shake">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Límite de pagos excedido</strong>
              Solo quedan <strong>{remaining}</strong> pago(s) restante(s) en este
              recordatorio. No podés adelantar {count}.
            </div>
          </div>
        )}

        {/* Resumen del gasto que se creará y la próxima fecha resultante */}
        {!isOverRemaining && (
          <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-purple-50/50 border border-indigo-100 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Gasto a registrar hoy:
              </span>
              <span className="text-base font-black text-indigo-700">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Concepto:</span>
              <strong className="text-slate-800 font-semibold truncate max-w-[200px]">
                {description}
              </strong>
            </div>

            <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Próximo recordatorio:</span>
              {willDeactivate ? (
                <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Finaliza el recordatorio
                </span>
              ) : newNextDate ? (
                <strong className="text-slate-800 font-bold">
                  {formatDayMonth(newNextDate)} ({newNextDate})
                </strong>
              ) : (
                <span className="text-slate-400">Finalizado</span>
              )}
            </div>

            {isExactRemaining && (
              <p className="text-[11px] text-amber-800/90 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60">
                ℹ️ Al adelantar estos {count} pagos restantes, el recordatorio habrá
                cumplido todas sus repeticiones y pasará al historial.
              </p>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isOverRemaining || count <= 0}
            className="flex-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>
              {count > 1 ? `Adelantar ${count} pagos` : 'Adelantar pago'}
            </span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
