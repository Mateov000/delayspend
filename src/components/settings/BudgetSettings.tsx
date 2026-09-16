import { useState } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { CategoryId } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency } from '../../utils/format';
import { Pencil, X, Check, CalendarDays, Plus } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function BudgetSettings() {
  const { budgets, weeklyLimit, setBudget, removeBudget, setWeeklyLimit } = useBudgetStore();
  const { showToast } = useToastStore();

  // Edición de categorías
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [editValue, setEditValue] = useState('');

  // Edición de límite semanal
  const [isEditingWeekly, setIsEditingWeekly] = useState(false);
  const [weeklyValue, setWeeklyValue] = useState(weeklyLimit ? String(weeklyLimit) : '');

  const getBudgetAmount = (categoryId: CategoryId): number => {
    return budgets.find((b) => b.categoryId === categoryId)?.amount ?? 0;
  };

  const handleStartEdit = (categoryId: CategoryId) => {
    const current = getBudgetAmount(categoryId);
    setEditingId(categoryId);
    setEditValue(current > 0 ? String(current) : '');
  };

  const handleSave = (categoryId: CategoryId) => {
    const amount = parseFloat(editValue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      showToast('Ingresá un monto válido.', 'error');
      return;
    }
    setBudget(categoryId, amount);
    setEditingId(null);
    setEditValue('');
    showToast(amount > 0 ? 'Presupuesto actualizado.' : 'Presupuesto eliminado.', 'success');
  };

  const handleRemove = (categoryId: CategoryId) => {
    removeBudget(categoryId);
    showToast('Presupuesto eliminado.', 'info');
  };

  const handleSaveWeekly = () => {
    const amount = parseFloat(weeklyValue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      showToast('Ingresá un monto semanal válido.', 'error');
      return;
    }
    setWeeklyLimit(amount > 0 ? amount : null);
    setIsEditingWeekly(false);
    showToast(amount > 0 ? 'Meta semanal establecida.' : 'Meta semanal eliminada.', 'success');
  };

  const handleRemoveWeekly = () => {
    setWeeklyLimit(null);
    setWeeklyValue('');
    setIsEditingWeekly(false);
    showToast('Meta semanal eliminada.', 'info');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SECCIÓN: LÍMITE DE GASTO SEMANAL */}
      <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">Meta de Gasto Semanal</span>
              <span className="text-[10px] text-slate-500 font-medium">
                Tope corriente de Lunes a Domingo
              </span>
            </div>
          </div>

          {/* Botón o display del monto semanal */}
          {!isEditingWeekly && (
            <div>
              {weeklyLimit && weeklyLimit > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-sky-900">
                    {formatCurrency(weeklyLimit)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setWeeklyValue(String(weeklyLimit));
                      setIsEditingWeekly(true);
                    }}
                    className="p-1 hover:bg-sky-200/60 rounded-lg text-sky-700 transition-colors cursor-pointer"
                    title="Editar meta semanal"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveWeekly}
                    className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors cursor-pointer"
                    title="Eliminar meta semanal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setWeeklyValue('');
                    setIsEditingWeekly(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Fijar meta</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Input en modo edición semanal */}
        {isEditingWeekly && (
          <div className="flex items-center gap-2 pt-2 border-t border-sky-200/60">
            <span className="text-sm font-bold text-sky-800">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={weeklyValue}
              onChange={(e) => setWeeklyValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveWeekly();
                if (e.key === 'Escape') setIsEditingWeekly(false);
              }}
              placeholder="Ej: 20000"
              autoFocus
              className="flex-1 text-sm font-bold text-slate-900 border border-sky-300 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={handleSaveWeekly}
              className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditingWeekly(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <p className="text-[10px] text-sky-800/80 leading-tight">
          Te ayuda a no esperar a fin de mes para corregir el rumbo. Podés ver el progreso en tiempo real en la pestaña <strong>Análisis</strong>.
        </p>
      </div>

      {/* 2. SECCIÓN: PRESUPUESTO POR CATEGORÍA */}
      <div className="flex flex-col gap-2.5">
        <div className="px-0.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Límites por Rubro / Categoría
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Recibirás una alerta suave al cargar gastos si estás por superar el tope.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const budgetAmount = getBudgetAmount(cat.id);
            const isEditing = editingId === cat.id;

            return (
              <div
                key={cat.id}
                className={`flex items-center gap-3 bg-white rounded-2xl px-3.5 py-2.5 border transition-colors ${
                  budgetAmount > 0 ? 'border-indigo-200/80 shadow-2xs' : 'border-slate-200/70'
                }`}
              >
                {/* Ícono */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.badgeBg} border ${cat.color}`}>
                  <CategoryIcon name={cat.icon} className="w-4 h-4" />
                </div>

                {/* Nombre */}
                <span className="text-xs font-semibold text-slate-700 flex-1 min-w-0 truncate">
                  {cat.name}
                </span>

                {/* Input o monto */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(cat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      placeholder="0"
                      autoFocus
                      className="w-20 text-xs font-bold text-slate-900 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(cat.id)}
                      className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors cursor-pointer"
                      aria-label="Guardar"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                      aria-label="Cancelar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : budgetAmount > 0 ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                      {formatCurrency(budgetAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={`Editar presupuesto para ${cat.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(cat.id)}
                      className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      aria-label={`Eliminar presupuesto para ${cat.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat.id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                  >
                    + Límite
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
