import { useMemo } from 'react';
import { Expense, Period } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import {
  calculateWeeklySpending,
  calculatePeriodGoalProgress,
  calculateCategorySpending,
} from '../../utils/budgetMetrics';
import { formatCurrency } from '../../utils/format';
import { CATEGORIES } from '../../constants/categories';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CalendarDays, Target, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

interface BudgetGoalsCardProps {
  expenses: Expense[];
  activePeriod: Period | null;
  onNavigateToSettings?: () => void;
}

export function BudgetGoalsCard({
  expenses,
  activePeriod,
  onNavigateToSettings,
}: BudgetGoalsCardProps) {
  const { weeklyLimit, budgets } = useBudgetStore();

  // 1. Métricas de la semana actual
  const weeklyMetrics = useMemo(
    () => calculateWeeklySpending(expenses, weeklyLimit),
    [expenses, weeklyLimit]
  );

  // 2. Métricas del período activo
  const periodGoal = useMemo(
    () => calculatePeriodGoalProgress(expenses, activePeriod),
    [expenses, activePeriod]
  );

  // 3. Progreso por categoría
  const categoryBudgetsMap = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const b of budgets) {
      map[b.categoryId] = b.amount;
    }
    return map;
  }, [budgets]);

  const categoryProgress = useMemo(() => {
    return calculateCategorySpending(expenses, categoryBudgetsMap)
      .filter((c) => c.hasBudget)
      .sort((a, b) => b.percentage - a.percentage);
  }, [expenses, categoryBudgetsMap]);

  const hasAnyGoal = Boolean(weeklyLimit || (activePeriod && activePeriod.initialIncome > 0) || budgets.length > 0);

  if (!hasAnyGoal) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">Sin metas de gasto activas</span>
            <span className="text-[11px] text-slate-400 font-medium">
              Fijá un límite semanal o por rubro para monitorear tu ritmo.
            </span>
          </div>
        </div>

        {onNavigateToSettings && (
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Configurar</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. META SEMANAL (si está activa) */}
      {weeklyLimit && weeklyLimit > 0 && (
        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Semana en Curso</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-extrabold text-slate-900">
                {formatCurrency(weeklyMetrics.spentThisWeek)}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                / {formatCurrency(weeklyMetrics.weeklyLimit!)}
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                weeklyMetrics.isOver
                  ? 'bg-rose-500'
                  : weeklyMetrics.isWarning
                  ? 'bg-amber-500'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, weeklyMetrics.percentage)}%` }}
            />
          </div>

          {/* Info y ritmo restante */}
          <div className="flex items-center justify-between text-[11px]">
            {weeklyMetrics.isOver ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Excedido por {formatCurrency(Math.abs(weeklyMetrics.remaining))}
              </span>
            ) : (
              <span className="text-slate-600 font-medium">
                Disponible: <strong className="text-slate-800">{formatCurrency(weeklyMetrics.remaining)}</strong>
              </span>
            )}

            {!weeklyMetrics.isOver && weeklyMetrics.dailyAllowance > 0 && (
              <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                {formatCurrency(weeklyMetrics.dailyAllowance)} / día ({weeklyMetrics.daysRemaining}d)
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. META DEL CICLO / PERÍODO ACTUAL (si tiene ingreso asignado) */}
      {periodGoal && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  {activePeriod?.name ?? 'Ciclo Actual'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Presupuesto del ciclo
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  {formatCurrency(periodGoal.spent)}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  / {formatCurrency(periodGoal.income)}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {periodGoal.percentage.toFixed(0)}% consumido
              </span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                periodGoal.isOver
                  ? 'bg-rose-500'
                  : periodGoal.isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, periodGoal.percentage)}%` }}
            />
          </div>

          {/* Pie de meta de ciclo */}
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            {periodGoal.isOver ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Excedido por {formatCurrency(Math.abs(periodGoal.remaining))}
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Restan {formatCurrency(periodGoal.remaining)} disponibles
              </span>
            )}

            <span className="text-[10px] text-slate-400 font-medium">
              Promedio: {formatCurrency(periodGoal.dailySpentAverage)}/día ({periodGoal.daysActive}d)
            </span>
          </div>
        </div>
      )}

      {/* 3. RESUMEN DE PRESUPUESTOS POR RUBRO (Top 3 activos) */}
      {categoryProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-slate-700">Presupuestos por Rubro</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {categoryProgress.length} rubro{categoryProgress.length !== 1 ? 's' : ''} activo{categoryProgress.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {categoryProgress.slice(0, 3).map((item) => {
              const cat = CATEGORIES.find((c) => c.id === item.categoryId);
              if (!cat) return null;

              return (
                <div key={item.categoryId} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center ${cat.badgeBg} ${cat.color}`}>
                        <CategoryIcon name={cat.icon} className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="font-bold text-slate-800">{formatCurrency(item.spent)}</span>
                      <span className="text-slate-400">/ {formatCurrency(item.budget)}</span>
                      <span
                        className={`font-bold ml-1 ${
                          item.isOver
                            ? 'text-rose-600'
                            : item.isWarning
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.isOver ? 'bg-rose-500' : item.isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
