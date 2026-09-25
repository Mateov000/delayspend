import { BellRing, Check, Clock, ChevronRight, X } from 'lucide-react';
import { ExpenseReminder } from '../../store/types';
import { useReminderStore } from '../../store/useReminderStore';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import { useToastStore } from '../../store/useToastStore';

interface ReminderBannerCardProps {
  onIncorporate: (reminder: ExpenseReminder) => void;
  onOpenManage: () => void;
}

export function ReminderBannerCard({
  onIncorporate,
  onOpenManage,
}: ReminderBannerCardProps) {
  const { getDueReminders, markIgnored } = useReminderStore();
  const { showToast } = useToastStore();

  const dueReminders = getDueReminders();

  if (dueReminders.length === 0) {
    return null;
  }

  const todayStr = new Date().toISOString().split('T')[0]!;

  const handleIgnore = (reminder: ExpenseReminder) => {
    markIgnored(reminder.id);
    showToast(`Recordatorio "${reminder.title}" ignorado.`, 'info');
  };

  const getRecurrenceLabel = (reminder: ExpenseReminder) => {
    if (reminder.recurrenceType === 'none') return 'Única vez';
    if (reminder.recurrenceType === 'custom_days') {
      return `Cada ${reminder.recurrenceIntervalDays || 1} días`;
    }
    if (reminder.recurrenceType === 'weekly') return 'Semanal';
    if (reminder.recurrenceType === 'monthly') return 'Mensual';
    return '';
  };

  const getDaysDiffLabel = (dateStr: string) => {
    if (dateStr === todayStr) {
      return { text: 'Hoy', isOverdue: false };
    }
    const target = new Date(`${dateStr}T00:00:00`).getTime();
    const today = new Date(`${todayStr}T00:00:00`).getTime();
    const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: formatDayMonth(dateStr), isOverdue: false };
    }
    if (diffDays === 1) {
      return { text: 'Ayer (pendiente)', isOverdue: true };
    }
    return { text: `Hace ${diffDays} días`, isOverdue: true };
  };

  return (
    <div className="flex flex-col gap-2.5 mb-4">
      {dueReminders.map((reminder) => {
        const { text: statusText, isOverdue } = getDaysDiffLabel(reminder.nextDate);
        const recurrenceLabel = getRecurrenceLabel(reminder);

        return (
          <div
            key={reminder.id}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all ${
              isOverdue
                ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-orange-50/50 border-amber-300/80 shadow-amber-500/5'
                : 'bg-gradient-to-br from-indigo-500/10 via-indigo-50/70 to-sky-50/50 border-indigo-200/80 shadow-indigo-500/5'
            }`}
          >
            {/* Cabecera del cartel */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isOverdue
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isOverdue
                        ? 'bg-amber-200/80 text-amber-900'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    Recordatorio
                  </span>
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      isOverdue ? 'text-amber-800' : 'text-slate-600'
                    }`}
                  >
                    <Clock className="w-3 h-3 inline" />
                    {statusText}
                  </span>
                </div>
              </div>

              {/* Botón para ver todos */}
              <button
                type="button"
                onClick={onOpenManage}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer shrink-0 transition-colors"
                title="Administrar recordatorios"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contenido principal: Título y Monto */}
            <div className="flex items-baseline justify-between gap-3 my-1">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-black text-slate-800 truncate">
                  {reminder.title}
                </h4>
                {recurrenceLabel && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    🔄 {recurrenceLabel}
                    {reminder.subcategory ? ` • ${reminder.subcategory}` : ''}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {formatCurrency(reminder.amount)}
                </span>
              </div>
            </div>

            {/* Botones de acción solicitados: Ignorar e Incorporar */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => handleIgnore(reminder)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>Ignorar</span>
              </button>

              <button
                type="button"
                onClick={() => onIncorporate(reminder)}
                className="flex-1.5 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Incorporar</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
