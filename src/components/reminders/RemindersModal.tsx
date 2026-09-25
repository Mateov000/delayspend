import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { ExpenseReminder } from '../../store/types';
import { useReminderStore } from '../../store/useReminderStore';
import { formatCurrency, formatDayMonth } from '../../utils/format';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  Repeat,
  Calendar,
  PlusCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToastStore } from '../../store/useToastStore';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNew: () => void;
  onEdit: (reminder: ExpenseReminder) => void;
  onIncorporate: (reminder: ExpenseReminder) => void;
}

export function RemindersModal({
  isOpen,
  onClose,
  onOpenNew,
  onEdit,
  onIncorporate,
}: RemindersModalProps) {
  const { reminders, deleteReminder, toggleActive } = useReminderStore();
  const { showToast } = useToastStore();

  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'active') return r.isActive;
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0]!;

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteReminder(deletingId);
      showToast('Recordatorio eliminado.', 'info');
      setDeletingId(null);
    }
  };

  const getRecurrenceText = (reminder: ExpenseReminder) => {
    if (reminder.recurrenceType === 'none') return 'Única vez';
    if (reminder.recurrenceType === 'custom_days') {
      return `Cada ${reminder.recurrenceIntervalDays || 1} días`;
    }
    if (reminder.recurrenceType === 'weekly') return 'Semanal';
    if (reminder.recurrenceType === 'monthly') return 'Mensual';
    return '';
  };

  const getEndConditionText = (reminder: ExpenseReminder) => {
    if (reminder.endCondition === 'never') return 'Sin fecha límite';
    if (reminder.endCondition === 'after_date' && reminder.endDate) {
      return `Hasta ${formatDayMonth(reminder.endDate)}`;
    }
    if (reminder.endCondition === 'after_occurrences' && reminder.maxOccurrences) {
      const remaining = Math.max(0, reminder.maxOccurrences - reminder.occurrencesCount);
      return `Quedan ${remaining} repeticiones`;
    }
    return '';
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Recordatorios de Gastos"
      >
        <div className="flex flex-col gap-3.5 pb-2">
          {/* Header con botón para nuevo recordatorio y filtros */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'active'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Activos ({reminders.filter((r) => r.isActive).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Todos ({reminders.length})
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenNew}
              className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          {/* Lista de Recordatorios */}
          {filteredReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center my-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mb-2.5">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {filter === 'active' ? 'No tenés recordatorios activos' : 'No tenés recordatorios creados'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 mb-3.5">
                Configurá recordatorios para pedir dinero periódicamente o registrar compras futuras sin alterar tus saldos actuales.
              </p>
              <button
                type="button"
                onClick={onOpenNew}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear mi primer recordatorio</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
              {filteredReminders.map((reminder) => {
                const isDue = reminder.isActive && reminder.nextDate <= todayStr;
                const recurrenceText = getRecurrenceText(reminder);
                const endText = getEndConditionText(reminder);

                return (
                  <div
                    key={reminder.id}
                    className={`rounded-2xl border p-3.5 transition-all ${
                      reminder.isActive
                        ? isDue
                          ? 'bg-amber-50/60 border-amber-200/90 shadow-2xs'
                          : 'bg-white border-slate-200/90 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200/60 opacity-60'
                    }`}
                  >
                    {/* Fila superior: Título, estado y monto */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              !reminder.isActive
                                ? 'bg-slate-200 text-slate-600'
                                : isDue
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {!reminder.isActive ? 'Pausado' : isDue ? '¡Pendiente!' : 'Programado'}
                          </span>
                          {reminder.subcategory && (
                            <span className="text-[10px] font-medium text-slate-500 truncate">
                              • {reminder.subcategory}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {reminder.title}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-slate-900">
                          {formatCurrency(reminder.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Fila intermedia: Fechas y Periodicidad */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Próximo: <strong className="text-slate-700">{formatDayMonth(reminder.nextDate)}</strong>
                      </span>
                      {recurrenceText && (
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3.5 h-3.5 text-slate-400" />
                          {recurrenceText}
                        </span>
                      )}
                      {endText && (
                        <span className="flex items-center gap-1 text-slate-400">
                          • {endText}
                        </span>
                      )}
                    </div>

                    {/* Fila de acciones */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleActive(reminder.id)}
                          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            reminder.isActive
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title={reminder.isActive ? 'Pausar recordatorio' : 'Reanudar recordatorio'}
                        >
                          {reminder.isActive ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Reanudar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEdit(reminder);
                          }}
                          className="flex items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingId(reminder.id)}
                          className="flex items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {reminder.isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onIncorporate(reminder);
                          }}
                          className="flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Incorporar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ConfirmDialog accesible para eliminar recordatorio */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="¿Eliminar recordatorio?"
        message="Se eliminará este recordatorio y sus futuras repeticiones. No afectará a ningún gasto que ya hayas incorporado previamente."
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
}
