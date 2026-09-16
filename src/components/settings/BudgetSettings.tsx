import { useState } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { CategoryId } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency } from '../../utils/format';
import { Pencil, X, Check } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function BudgetSettings() {
  const { budgets, setBudget, removeBudget } = useBudgetStore();
  const { showToast } = useToastStore();
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-slate-500 px-1">
        Definí un límite de gasto mensual por categoría. Vas a recibir avisos cuando te estés acercando al tope.
      </p>

      <div className="flex flex-col gap-2">
        {CATEGORIES.map((cat) => {
          const budgetAmount = getBudgetAmount(cat.id);
          const isEditing = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className={`flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 border transition-colors ${
                budgetAmount > 0 ? 'border-indigo-200/80' : 'border-slate-200/80'
              }`}
            >
              {/* Ícono */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.badgeBg} border ${cat.color}`}>
                <CategoryIcon name={cat.icon} className="w-4 h-4" />
              </div>

              {/* Nombre */}
              <span className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">
                {cat.name}
              </span>

              {/* Input o monto */}
              {isEditing ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-slate-500">$</span>
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
                    className="w-24 text-sm font-bold text-slate-900 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSave(cat.id)}
                    className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors cursor-pointer"
                    aria-label="Guardar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                    aria-label="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  {budgetAmount > 0 ? (
                    <>
                      <span className="text-sm font-bold text-indigo-700">
                        {formatCurrency(budgetAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat.id)}
                        className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                        aria-label="Editar presupuesto"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(cat.id)}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                        aria-label="Quitar presupuesto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id)}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-indigo-200/60"
                    >
                      + Límite
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
