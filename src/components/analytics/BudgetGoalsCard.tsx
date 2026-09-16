import { useMemo } from 'react';
import { Expense, Period } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import {
  calculateWeeklySpending,
  calculatePeriodGoalProgress,
  calculateCategorySpending,
  calculateCategoryWeeklySpending,
} from '../../utils/budgetMetrics';
import { formatCurrency } from '../../utils/format';
import { useCategoryStore, getAllCategories } from '../../store/useCategoryStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CalendarDays, Target, AlertTriangle, CheckCircle, Plus, ShieldCheck } from 'lucide-react';

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
  const { customCategories } = useCategoryStore();
  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);

  // 1. Metricas de la semana actual (Global)
  const weeklyMetrics = useMemo(
    () => calculateWeeklySpending(expenses, weeklyLimit),
    [expenses, weeklyLimit]
  );

  // 2. Metricas semanales por categoria
  const weeklyBudgetsMap = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const b of budgets) {
      if (b.weeklyAmount && b.weeklyAmount > 0) {
        map[b.categoryId] = b.weeklyAmount;
      }
    }
    return map;
  }, [budgets]);

  const categoryWeeklyProgress = useMemo(() => {
    return calculateCategoryWeeklySpending(expenses, weeklyBudgetsMap);
  }, [expenses, weeklyBudgetsMap]);

  // 3. Metricas del periodo activo
  const periodGoal = useMemo(
    () => calculatePeriodGoalProgress(expenses, activePeriod),
    [expenses, activePeriod]
  );

  // 4. Progreso por categoria (Presupuesto de ciclo)
  const categoryBudgetsMap = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const b of budgets) {
      if (b.amount > 0) {
        map[b.categoryId] = b.amount;
      }
    }
    return map;
  }, [budgets]);

  const categoryProgress = useMemo(() => {
    return calculateCategorySpending(expenses, categoryBudgetsMap)
      .filter((c) => c.hasBudget)
      .sort((a, b) => b.percentage - a.percentage);
  }, [expenses, categoryBudgetsMap]);

  const hasWeeklySection = Boolean(weeklyLimit || categoryWeeklyProgress.length > 0);
  const hasAnyGoal = Boolean(
    hasWeeklySection || (activePeriod && activePeriod.initialIncome > 0) || budgets.length > 0
  );

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
              Fija un limite semanal o por rubro para monitorear tu ritmo.
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
      {/* 1. SECCION: METAS SEMANALES (Global y por Categoria) */}
      {hasWeeklySection && (
        <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col gap-3">
          {/* Header Global */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Semana en Curso</span>
            </div>

            {weeklyMetrics.weeklyLimit && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  {formatCurrency(weeklyMetrics.spentThisWeek)}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  / {formatCurrency(weeklyMetrics.weeklyLimit)}
                </span>
              </div>
            )}
          </div>

          {/* Barra Global (si hay meta global) */}
          {weeklyMetrics.weeklyLimit && (
            <div className="flex flex-col gap-1.5">
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
                    {formatCurrency(weeklyMetrics.dailyAllowance)} / dia ({weeklyMetrics.daysRemaining}d)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metas semanales por rubro */}
          {categoryWeeklyProgress.length > 0 && (
            <div className={`flex flex-col gap-2.5 ${weeklyMetrics.weeklyLimit ? 'pt-2.5 border-t border-sky-100/80' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider">
                  Metas Semanales por Rubro
                </span>
                <span className="text-[9px] font-semibold text-slate-400">
                  {categoryWeeklyProgress.length} rubro{categoryWeeklyProgress.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {categoryWeeklyProgress.map((item) => {
                  const cat = allCategories.find((c) => c.id === item.categoryId);
                  if (!cat) return null;

                  return (
                    <div key={item.categoryId} className="flex flex-col gap-1 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${cat.badgeBg} ${cat.color}`}>
                            <CategoryIcon name={cat.icon} className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-semibold text-slate-700">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="font-bold text-slate-800">{formatCurrency(item.spent)}</span>
                          <span className="text-slate-400">/ {formatCurrency(item.weeklyBudget)}</span>
                          <span
                            className={`font-bold ml-0.5 ${
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

                      <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.isOver ? 'bg-rose-500' : item.isWarning ? 'bg-amber-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                        <span>
                          {item.isOver ? (
                            <strong className="text-rose-600">Excedido por {formatCurrency(Math.abs(item.remaining))}</strong>
                          ) : (
                            <span>Disponible: <strong className="text-slate-600">{formatCurrency(item.remaining)}</strong></span>
                          )}
                        </span>
                        {!item.isOver && item.dailyAllowance > 0 && (
                          <span className="text-sky-700 font-semibold">{formatCurrency(item.dailyAllowance)}/dia</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. META DEL CICLO / PERIODO ACTUAL */}
      {periodGoal && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  {activePeriod?.name ?? 'Ciclo Actual'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Presupuesto: {formatCurrency(periodGoal.income)}
                </span>
              </div>
            </div>

            {/* Desglose de Gastado Real vs DelaySpend */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-extrabold text-slate-900">
                  {formatCurrency(periodGoal.spent)}
                </span>
                {periodGoal.delayed > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                    <ShieldCheck className="w-3 h-3" />
                    +{formatCurrency(periodGoal.delayed)} delay
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {periodGoal.percentage.toFixed(0)}% rendido
              </span>
            </div>
          </div>

          {/* Barra de progreso bicromatica: Real (rosa) + DelaySpend (esmeralda) */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, periodGoal.realPercentage)}%` }}
              title={`Gastado: ${formatCurrency(periodGoal.spent)}`}
            />
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100 - Math.min(100, periodGoal.realPercentage),
                  periodGoal.delayedPercentage
                )}%`,
              }}
              title={`DelaySpend: ${formatCurrency(periodGoal.delayed)}`}
            />
          </div>

          {/* Leyenda y detalles del saldo restante con DelaySpend restado */}
          <div className="flex flex-col gap-1.5 pt-0.5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px]">
              {periodGoal.isOver ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Excedido por {formatCurrency(Math.abs(periodGoal.remaining))}
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Restan <strong className="font-extrabold text-emerald-800">{formatCurrency(periodGoal.remaining)}</strong> disponibles
                </span>
              )}

              <span className="text-[10px] text-slate-400">
                {periodGoal.daysActive} dia{periodGoal.daysActive !== 1 ? 's' : ''} de ciclo
              </span>
            </div>

            {/* Ritmo diario: Cotidiano (puro) vs Global y con Delay */}
            <div className="flex flex-col gap-1 text-[10px] text-slate-500 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  🛒 Ritmo cotidiano:
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  {formatCurrency(periodGoal.dailyPaceAverage)} / día
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/50">
                <span>Promedio global: {formatCurrency(periodGoal.dailySpentAverage)}/d</span>
                <span>c/Delay: {formatCurrency(periodGoal.dailyTotalAverage)}/d</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESUMEN DE PRESUPUESTOS POR RUBRO DEL CICLO (Top 3 activos) */}
      {categoryProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold text-slate-700">Presupuestos por Rubro (Ciclo)</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {categoryProgress.length} rubro{categoryProgress.length !== 1 ? 's' : ''} activo{categoryProgress.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {categoryProgress.slice(0, 3).map((item) => {
              const cat = allCategories.find((c) => c.id === item.categoryId);
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
