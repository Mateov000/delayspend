import { useState } from 'react';
import { CategoryId } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import {
  useCategoryStore,
  getAllCategories,
  AVAILABLE_CATEGORY_ICONS,
  CATEGORY_PALETTES,
} from '../../store/useCategoryStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import { formatCurrency } from '../../utils/format';
import {
  Pencil,
  X,
  Check,
  CalendarDays,
  Plus,
  Target,
  Trash2,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function BudgetSettings() {
  const {
    budgets,
    weeklyLimit,
    setBudget,
    removeBudget,
    setWeeklyBudget,
    removeWeeklyBudget,
    setWeeklyLimit,
  } = useBudgetStore();

  const {
    customCategories,
    parentMaskedCategoryIds,
    addCustomCategory,
    removeCustomCategory,
    toggleParentMaskedCategory,
  } = useCategoryStore();

  const { showToast } = useToastStore();

  // Modo de visualizacion de presupuestos: por ciclo/mes o por semana
  const [budgetMode, setBudgetMode] = useState<'cycle' | 'weekly'>('cycle');

  // Todas las categorias (nativas + personalizadas)
  const allCategories = getAllCategories(customCategories);

  // Edicion de presupuesto por categoria
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [editValue, setEditValue] = useState('');

  // Edicion de limite semanal global
  const [isEditingWeekly, setIsEditingWeekly] = useState(false);
  const [weeklyValue, setWeeklyValue] = useState(weeklyLimit ? String(weeklyLimit) : '');

  // Creacion de nueva categoria personalizada
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [newCatPalette, setNewCatPalette] = useState(0);

  // Colapsable de Privacidad para Padres
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);

  const getBudgetAmount = (categoryId: CategoryId): number => {
    const b = budgets.find((item) => item.categoryId === categoryId);
    if (!b) return 0;
    return budgetMode === 'cycle' ? b.amount : (b.weeklyAmount ?? 0);
  };

  const handleStartEdit = (categoryId: CategoryId) => {
    const current = getBudgetAmount(categoryId);
    setEditingId(categoryId);
    setEditValue(current > 0 ? String(current) : '');
  };

  const handleSave = (categoryId: CategoryId) => {
    const amount = parseFloat(editValue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      showToast('Ingresa un monto valido.', 'error');
      return;
    }

    if (budgetMode === 'cycle') {
      setBudget(categoryId, amount);
      showToast(
        amount > 0 ? 'Presupuesto de ciclo actualizado.' : 'Presupuesto de ciclo eliminado.',
        'success'
      );
    } else {
      setWeeklyBudget(categoryId, amount);
      showToast(
        amount > 0 ? 'Meta semanal de rubro actualizada.' : 'Meta semanal de rubro eliminada.',
        'success'
      );
    }

    setEditingId(null);
    setEditValue('');
  };

  const handleRemove = (categoryId: CategoryId) => {
    if (budgetMode === 'cycle') {
      removeBudget(categoryId);
      showToast('Presupuesto de ciclo eliminado.', 'info');
    } else {
      removeWeeklyBudget(categoryId);
      showToast('Meta semanal de rubro eliminada.', 'info');
    }
  };

  const handleSaveWeekly = () => {
    const amount = parseFloat(weeklyValue.replace(',', '.'));
    if (isNaN(amount) || amount < 0) {
      showToast('Ingresa un monto semanal valido.', 'error');
      return;
    }
    setWeeklyLimit(amount > 0 ? amount : null);
    setIsEditingWeekly(false);
    showToast(amount > 0 ? 'Meta semanal global establecida.' : 'Meta semanal global eliminada.', 'success');
  };

  const handleRemoveWeekly = () => {
    setWeeklyLimit(null);
    setWeeklyValue('');
    setIsEditingWeekly(false);
    showToast('Meta semanal global eliminada.', 'info');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      showToast('Ingresa un nombre para la categoria.', 'error');
      return;
    }

    const created = addCustomCategory(cleanName, newCatIcon, newCatPalette);
    setNewCatName('');
    setIsCreatingCategory(false);
    showToast('Categoría "' + created.name + '" creada con éxito.', 'success');
  };

  const handleDeleteCustomCategory = (id: string, name: string) => {
    removeCustomCategory(id);
    removeBudget(id);
    removeWeeklyBudget(id);
    showToast('Categoría "' + name + '" eliminada.', 'info');
  };

  // Contadores para chips informativos
  const cycleBudgetsCount = budgets.filter((b) => b.amount > 0).length;
  const weeklyBudgetsCount = budgets.filter((b) => (b.weeklyAmount ?? 0) > 0).length;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. SECCION: LIMITE DE GASTO SEMANAL GLOBAL */}
      <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">Meta Semanal Global</span>
              <span className="text-[10px] text-slate-500 font-medium">
                Tope corriente total de Lunes a Domingo
              </span>
            </div>
          </div>

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
                    title="Editar meta semanal global"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveWeekly}
                    className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors cursor-pointer"
                    title="Eliminar meta semanal global"
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
          Tope general de gastos para la semana. Podes ademas definir metas individuales por categoria abajo.
        </p>
      </div>

      {/* 2. SECCION: PRIVACIDAD PARA REPORTE DE PADRES */}
      <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div
          onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
          className="flex items-center justify-between cursor-pointer w-full"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Privacidad en Rendicion a Padres</span>
                <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                  {parentMaskedCategoryIds.length} enmascarada{parentMaskedCategoryIds.length !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Se muestran como "Otros Gastos" al exportar
              </span>
            </div>
          </div>

          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label={isPrivacyExpanded ? 'Colapsar privacidad' : 'Expandir privacidad'}
          >
            {isPrivacyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isPrivacyExpanded && (
          <div className="flex flex-col gap-2 pt-2 border-t border-amber-200/60">
            <p className="text-[10px] text-amber-900/90 leading-relaxed">
              Las categorias tildadas se agruparan bajo el nombre <strong>"Otros Gastos"</strong> al generar el reporte de WhatsApp o CSV para tus padres. El monto total de la rendicion sigue siendo 100% exacto, pero evitas preguntas innecesarias.
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {allCategories
                .filter((cat) => cat.id !== 'vices')
                .map((cat) => {
                  const isMasked = parentMaskedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        toggleParentMaskedCategory(cat.id);
                        showToast(
                          !isMasked
                            ? 'Rubro se mostrara como "Otros Gastos" a tus padres.'
                            : 'Rubro volvera a ser visible a tus padres.',
                          'info'
                        );
                      }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isMasked
                          ? 'bg-amber-100/90 border-amber-300/80 text-amber-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 font-medium hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${cat.badgeBg} border ${cat.color}`}>
                        <CategoryIcon name={cat.icon} className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] truncate flex-1">{cat.name}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[8px] ${
                          isMasked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isMasked ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
            </div>

            <p className="text-[10px] text-amber-900 font-semibold flex items-center gap-1 mt-1 bg-amber-100/60 p-2 rounded-xl border border-amber-200/70">
              <span className="shrink-0">🔥</span>
              <span>
                <strong>Privacidad absoluta de Vicios:</strong> Esta categoría cuenta con exclusión automática total (0% de probabilidad de mostrarse en reportes de WhatsApp o CSV para padres).
              </span>
            </p>
          </div>
        )}
      </div>

      {/* 3. SECCION: PRESUPUESTOS POR RUBRO (CON SELECTOR CICLO VS SEMANAL) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Limites por Rubro / Categoria
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {budgetMode === 'cycle'
                ? 'Presupuesto total para todo el periodo o mes.'
                : 'Meta de gasto para cada semana (Lunes a Domingo).'}
            </p>
          </div>

          {/* Boton para crear nueva categoria */}
          <button
            type="button"
            onClick={() => setIsCreatingCategory(!isCreatingCategory)}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Nueva Categoria</span>
          </button>
        </div>

        {/* Formulario de creacion de categoria personalizada */}
        {isCreatingCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Crear Nueva Categoria
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nombre del rubro
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Mascotas, Gimnasio, Auto, Cuidado Personal..."
                autoFocus
                className="w-full text-xs font-bold text-slate-900 border border-indigo-300 rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Selector de icono */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Icono
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {AVAILABLE_CATEGORY_ICONS.slice(0, 10).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewCatIcon(iconName)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      newCatIcon === iconName
                        ? 'bg-indigo-600 text-white shadow-xs scale-105'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryIcon name={iconName} className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Color
              </label>
              <div className="flex items-center gap-1.5">
                {CATEGORY_PALETTES.map((pal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewCatPalette(idx)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${pal.badgeBg} ${
                      newCatPalette === idx ? 'ring-2 ring-indigo-500 scale-110 border-white' : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-200/60">
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="px-3 py-1.5 rounded-xl text-slate-500 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
              >
                Guardar Categoria
              </button>
            </div>
          </form>
        )}

        {/* Selector conmutador de modo: Ciclo vs Semanal */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              setBudgetMode('cycle');
              setEditingId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              budgetMode === 'cycle'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Por Ciclo / Mes</span>
            {cycleBudgetsCount > 0 && (
              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                {cycleBudgetsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setBudgetMode('weekly');
              setEditingId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              budgetMode === 'weekly'
                ? 'bg-white text-sky-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Por Semana</span>
            {weeklyBudgetsCount > 0 && (
              <span className="text-[9px] bg-sky-50 text-sky-700 px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                {weeklyBudgetsCount}
              </span>
            )}
          </button>
        </div>

        {/* Listado de todas las categorias */}
        <div className="flex flex-col gap-2">
          {allCategories.map((cat) => {
            const budgetAmount = getBudgetAmount(cat.id);
            const isEditing = editingId === cat.id;
            const isWeekly = budgetMode === 'weekly';
            const isCustom = Boolean(cat.isCustom);

            return (
              <div
                key={cat.id}
                className={`flex items-center gap-3 bg-white rounded-2xl px-3.5 py-2.5 border transition-colors ${
                  budgetAmount > 0
                    ? isWeekly
                      ? 'border-sky-200/90 shadow-2xs'
                      : 'border-indigo-200/90 shadow-2xs'
                    : 'border-slate-200/70'
                }`}
              >
                {/* Icono */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.badgeBg} border ${cat.color}`}
                >
                  <CategoryIcon name={cat.icon} className="w-4 h-4" />
                </div>

                {/* Nombre y etiquetas */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {cat.name}
                    </span>
                    {isCustom && (
                      <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    {isWeekly ? 'Meta semanal' : 'Presupuesto de ciclo'}
                  </span>
                </div>

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
                      className={`w-20 text-xs font-bold text-slate-900 border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 ${
                        isWeekly
                          ? 'border-sky-300 focus:ring-sky-400'
                          : 'border-indigo-300 focus:ring-indigo-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(cat.id)}
                      className={`w-6 h-6 rounded-lg text-white flex items-center justify-center transition-colors cursor-pointer ${
                        isWeekly
                          ? 'bg-sky-600 hover:bg-sky-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
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
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        isWeekly
                          ? 'text-sky-900 bg-sky-50 border-sky-200'
                          : 'text-indigo-900 bg-indigo-50 border-indigo-200'
                      }`}
                    >
                      {formatCurrency(budgetAmount)}
                      {isWeekly && <span className="text-[9px] font-normal text-sky-600 ml-0.5">/sem</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      aria-label={`Editar ${isWeekly ? 'meta semanal' : 'presupuesto'} para ${cat.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(cat.id)}
                      className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      aria-label={`Eliminar ${isWeekly ? 'meta semanal' : 'presupuesto'} para ${cat.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id)}
                      className={`text-[11px] font-semibold border border-dashed px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                        isWeekly
                          ? 'text-slate-400 hover:text-sky-600 hover:bg-sky-50 border-slate-200 hover:border-sky-200'
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      {isWeekly ? '+ Meta semanal' : '+ Límite ciclo'}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCategory(cat.id, cat.name)}
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={`Eliminar categoria ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
