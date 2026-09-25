import { useState, useEffect, FormEvent } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import {
  ExpenseReminder,
  ReminderInput,
  ReminderRecurrenceType,
  ReminderEndCondition,
  CategoryId,
} from '../../store/types';
import { useReminderStore } from '../../store/useReminderStore';
import { useToastStore } from '../../store/useToastStore';
import { CATEGORIES } from '../../constants/categories';
import { Calendar, DollarSign, Tag, Clock, Repeat, ShieldAlert } from 'lucide-react';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReminder?: ExpenseReminder | null;
}

export function ReminderFormModal({
  isOpen,
  onClose,
  editingReminder,
}: ReminderFormModalProps) {
  const { addReminder, updateReminder } = useReminderStore();
  const { showToast } = useToastStore();

  const todayStr = new Date().toISOString().split('T')[0]!;

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('health');
  const [subcategory, setSubcategory] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [recurrenceType, setRecurrenceType] = useState<ReminderRecurrenceType>('custom_days');
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState<number>(15);
  const [endCondition, setEndCondition] = useState<ReminderEndCondition>('never');
  const [endDate, setEndDate] = useState('');
  const [maxOccurrences, setMaxOccurrences] = useState<number>(6);

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setAmountStr(String(editingReminder.amount));
      setCategoryId(editingReminder.categoryId || 'health');
      setSubcategory(editingReminder.subcategory || '');
      setStartDate(editingReminder.startDate);
      setRecurrenceType(editingReminder.recurrenceType);
      setRecurrenceIntervalDays(editingReminder.recurrenceIntervalDays || 15);
      setEndCondition(editingReminder.endCondition);
      setEndDate(editingReminder.endDate || '');
      setMaxOccurrences(editingReminder.maxOccurrences || 6);
    } else {
      setTitle('');
      setAmountStr('');
      setCategoryId('health');
      setSubcategory('');
      setStartDate(todayStr);
      setRecurrenceType('custom_days');
      setRecurrenceIntervalDays(15);
      setEndCondition('never');
      setEndDate('');
      setMaxOccurrences(6);
    }
  }, [editingReminder, isOpen, todayStr]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Por favor ingresá un nombre o concepto para el recordatorio.', 'error');
      return;
    }

    const cleanAmount = parseFloat(amountStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    if (cleanAmount <= 0) {
      showToast('Por favor ingresá un monto mayor a 0.', 'error');
      return;
    }

    const reminderData: ReminderInput = {
      title: title.trim(),
      amount: cleanAmount,
      categoryId,
      subcategory: subcategory.trim() || undefined,
      startDate: startDate || todayStr,
      recurrenceType,
      recurrenceIntervalDays:
        recurrenceType === 'custom_days'
          ? Math.max(1, recurrenceIntervalDays || 1)
          : undefined,
      endCondition,
      endDate: endCondition === 'after_date' ? endDate || null : null,
      maxOccurrences: endCondition === 'after_occurrences' ? Math.max(1, maxOccurrences || 1) : null,
    };

    if (editingReminder) {
      updateReminder(editingReminder.id, reminderData);
      showToast('Recordatorio actualizado con éxito.', 'success');
    } else {
      addReminder(reminderData);
      showToast('Recordatorio creado exitosamente.', 'success');
    }

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio de Gasto'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <p className="text-xs text-slate-500">
          Configurá recordatorios para compras futuras o para recuperar dinero periódicamente (ej: pedir dinero de pastillas cada X días).
        </p>

        {/* 1. Concepto / Título */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Concepto o Título *</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Pedir plata pastillas a mamá"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
          />
        </div>

        {/* 2. Monto a recordar / pedir */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Monto acordado o estimado *</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* 3. Categoría y Subcategoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as CategoryId)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subcategoría (opcional)
            </label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="Ej: Pastillas"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 4. Fecha del recordatorio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Fecha del primer aviso</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>

        {/* 5. Periodicidad */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-slate-400" />
            <span>Periodicidad de repetición</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRecurrenceType('custom_days')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recurrenceType === 'custom_days'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Cada X días
            </button>
            <button
              type="button"
              onClick={() => setRecurrenceType('weekly')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recurrenceType === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => setRecurrenceType('monthly')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recurrenceType === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setRecurrenceType('none')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                recurrenceType === 'none'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Única vez
            </button>
          </div>

          {/* Si eligió "Cada X días" */}
          {recurrenceType === 'custom_days' && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 mt-1">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Repetir cada</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={recurrenceIntervalDays}
                  onChange={(e) => setRecurrenceIntervalDays(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-sm font-black text-indigo-700 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">días</span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Fin de la repetición (solo si es recurrente) */}
        {recurrenceType !== 'none' && (
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Fin de la repetición</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setEndCondition('never')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  endCondition === 'never'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Nunca
              </button>
              <button
                type="button"
                onClick={() => setEndCondition('after_date')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  endCondition === 'after_date'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Hasta fecha
              </button>
              <button
                type="button"
                onClick={() => setEndCondition('after_occurrences')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  endCondition === 'after_occurrences'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                X veces
              </button>
            </div>

            {endCondition === 'after_date' && (
              <div className="mt-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Fecha límite"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white"
                />
              </div>
            )}

            {endCondition === 'after_occurrences' && (
              <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Finalizar después de</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(parseInt(e.target.value, 10) || 1)}
                  className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 text-center"
                />
                <span className="text-xs font-medium text-slate-600">repeticiones</span>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-2 pt-3 mt-1 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {editingReminder ? 'Guardar Cambios' : 'Crear Recordatorio'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

