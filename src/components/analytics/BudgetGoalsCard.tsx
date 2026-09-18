import { useState, useMemo } from 'react';
import { Expense, Period, BudgetPeriodType, CategoryId } from '../../store/types';
import { useBudgetStore } from '../../store/useBudgetStore';
import {
  calculateWeeklySpending,
  calculateMonthlySpending,
  calculateCustomDaysSpending,
  calculatePeriodGoalProgress,
  calculateCategorySpending,
  calculateCategoryPeriodicSpending,
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCustomDaysRange,
} from '../../utils/budgetMetrics';
import { formatCurrency } from '../../utils/format';
import { useCategoryStore, getAllCategories } from '../../store/useCategoryStore';
import { CategoryIcon } from '../ui/CategoryIcon';
import {
  CalendarDays,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShieldCheck,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';

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
  const {
    weeklyLimit,
    monthlyLimit,
    customLimit,
    goalPeriodType,
    customGoalDays,
    setGoalPeriodType,
    budgets,
  } = useBudgetStore();

  const { customCategories } = useCategoryStore();
  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);

  // Tab activa de periodicidad
  const [activeTab, setActiveTab] = useState<BudgetPeriodType>(goalPeriodType || 'cycle');

  // 1. Métricas Por Ciclo
  const periodGoal = useMemo(
    () => calculatePeriodGoalProgress(expenses, activePeriod),
    [expenses, activePeriod]
  );

  const cycleBudgetsMap = useMemo(() => {
    const map = {} as Record<CategoryId, number>;
    for (const b of budgets) {
      if (b.amount > 0) map[b.categoryId] = b.amount;
    }
    return map;
  }, [budgets]);

  const cycleCategoryProgress = useMemo(() => {
    return calculateCategorySpending(expenses, cycleBudgetsMap)
      .filter((c) => c.hasBudget)
      .sort((a, b) => b.percentage - a.percentage);
  }, [expenses, cycleBudgetsMap]);

  // 2. Métricas Por Semana
  const weeklyMetrics = useMemo(
    () => calculateWeeklySpending(expenses, weeklyLimit),
    [expenses, weeklyLimit]
  );

  const weeklyBudgetsMap = useMemo(() => {
    const map = {} as Record<CategoryId, number>;
    for (const b of budgets) {
      if (b.weeklyAmount && b.weeklyAmount > 0) map[b.categoryId] = b.weeklyAmount;
    }
    return map;
  }, [budgets]);

  const weekRange = useMemo(() => getCurrentWeekRange(), []);
  const weeklyCategoryProgress = useMemo(() => {
    return calculateCategoryPeriodicSpending(
      expenses,
      weeklyBudgetsMap,
      weekRange.start,
      weekRange.end,
      weeklyMetrics.daysRemaining
    );
  }, [expenses, weeklyBudgetsMap, weekRange, weeklyMetrics.daysRemaining]);

  // 3. Métricas Por Mes
  const monthlyMetrics = useMemo(
    () => calculateMonthlySpending(expenses, monthlyLimit),
    [expenses, monthlyLimit]
  );

  const monthlyBudgetsMap = useMemo(() => {
    const map = {} as Record<CategoryId, number>;
    for (const b of budgets) {
      if (b.monthlyAmount && b.monthlyAmount > 0) map[b.categoryId] = b.monthlyAmount;
    }
    return map;
  }, [budgets]);

  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const monthlyCategoryProgress = useMemo(() => {
    return calculateCategoryPeriodicSpending(
      expenses,
      monthlyBudgetsMap,
      monthRange.start,
      monthRange.end,
      monthlyMetrics.daysRemaining
    );
  }, [expenses, monthlyBudgetsMap, monthRange, monthlyMetrics.daysRemaining]);

  // 4. Métricas Personalizadas (N días)
  const customMetrics = useMemo(
    () => calculateCustomDaysSpending(expenses, customLimit, customGoalDays),
    [expenses, customLimit, customGoalDays]
  );

  const customBudgetsMap = useMemo(() => {
    const map = {} as Record<CategoryId, number>;
    for (const b of budgets) {
      if (b.customAmount && b.customAmount > 0) map[b.categoryId] = b.customAmount;
    }
    return map;
  }, [budgets]);

  const customRange = useMemo(() => getCustomDaysRange(customGoalDays), [customGoalDays]);
  const customCategoryProgress = useMemo(() => {
    return calculateCategoryPeriodicSpending(
      expenses,
      customBudgetsMap,
      customRange.start,
      customRange.end,
      1
    );
  }, [expenses, customBudgetsMap, customRange]);

  const handleTabChange = (tab: BudgetPeriodType) => {
    setActiveTab(tab);
    setGoalPeriodType(tab);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de Pestañas de Periodicidad (Ciclo, Mes, Semana, N días) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange('cycle')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            activeTab === 'cycle'
              ? 'bg-white text-indigo-950 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Por Ciclo</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('monthly')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            activeTab === 'monthly'
              ? 'bg-white text-indigo-950 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>Por Mes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('weekly')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            activeTab === 'weekly'
              ? 'bg-white text-indigo-950 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-3 h-3" />
          <span>Por Semana</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('custom')}
          className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
            activeTab === 'custom'
              ? 'bg-white text-indigo-950 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{customGoalDays} días</span>
        </button>
      </div>

      {/* ==================== VISTA: POR CICLO ==================== */}
      {activeTab === 'cycle' && (
        <>
          {periodGoal ? (
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

              {/* Barra de progreso bicromática */}
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

              {/* Leyenda y detalles del saldo disponible */}
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
                      Restan{' '}
                      <strong className="font-extrabold text-emerald-800">
                        {formatCurrency(periodGoal.remaining)}
                      </strong>{' '}
                      disponibles
                    </span>
                  )}

                  <span className="text-[10px] text-slate-400">
                    {periodGoal.daysActive} día{periodGoal.daysActive !== 1 ? 's' : ''} de ciclo
                  </span>
                </div>

                {/* Ritmo diario: Cotidiano puro y con DelaySpend corriente */}
                <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <span>🛒</span>
                      <span>Promedio diario corriente:</span>
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-black text-emerald-800 text-sm">
                        {formatCurrency(periodGoal.dailyPaceAverage)} / día
                      </span>
                      {periodGoal.delayedDaily > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span>c/Delay corriente:</span>
                          <strong>
                            {formatCurrency(periodGoal.dailyPaceWithDelayedAverage)}/d
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {(periodGoal.spentFixed > 0 ||
                    periodGoal.spentEventual > 0 ||
                    periodGoal.spentHouse > 0) && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                      <span className="font-medium text-slate-600">Excluidos del promedio:</span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 flex-wrap">
                        {periodGoal.spentFixed > 0 && (
                          <span>🔄 Fijos: {formatCurrency(periodGoal.spentFixed)}</span>
                        )}
                        {periodGoal.spentEventual > 0 && (
                          <span>⚡ Eventuales: {formatCurrency(periodGoal.spentEventual)}</span>
                        )}
                        {periodGoal.spentHouse > 0 && (
                          <span>🏠 Casa: {formatCurrency(periodGoal.spentHouse)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/40">
                    <span>Promedio total con todo: {formatCurrency(periodGoal.dailySpentAverage)}/d</span>
                    <span>c/Delay: {formatCurrency(periodGoal.dailyTotalAverage)}/d</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyGoalNotice
              title="Sin presupuesto asignado en este ciclo"
              subtitle="Editá este período para asignarle un monto o fijá metas de rubro en Ajustes."
              onNavigateToSettings={onNavigateToSettings}
            />
          )}

          {/* Metas por rubro del ciclo */}
          {cycleCategoryProgress.length > 0 && (
            <CategoryGoalsSection
              title="Metas de Ciclo por Rubro"
              items={cycleCategoryProgress}
              allCategories={allCategories}
            />
          )}
        </>
      )}

      {/* ==================== VISTA: POR MES ==================== */}
      {activeTab === 'monthly' && (
        <>
          <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Mes en Curso</h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {monthlyMetrics.startDateStr} al {monthlyMetrics.endDateStr}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(monthlyMetrics.spent)}
                  </span>
                  {monthlyMetrics.limit && (
                    <span className="text-[11px] font-medium text-slate-400">
                      / {formatCurrency(monthlyMetrics.limit)}
                    </span>
                  )}
                </div>
                {monthlyMetrics.limit && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {monthlyMetrics.percentage.toFixed(0)}% del límite
                  </span>
                )}
              </div>
            </div>

            {monthlyMetrics.limit ? (
              <div className="flex flex-col gap-1.5">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      monthlyMetrics.isOver
                        ? 'bg-rose-500'
                        : monthlyMetrics.isWarning
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, monthlyMetrics.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  {monthlyMetrics.isOver ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Excedido por {formatCurrency(Math.abs(monthlyMetrics.remaining))}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      Disponible: <strong className="text-slate-800">{formatCurrency(monthlyMetrics.remaining)}</strong>
                    </span>
                  )}

                  {!monthlyMetrics.isOver && monthlyMetrics.dailyAllowance > 0 && (
                    <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                      {formatCurrency(monthlyMetrics.dailyAllowance)} / día ({monthlyMetrics.daysRemaining}d rest.)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Sin límite mensual global fijado</span>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
                  >
                    Fijar límite
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Ritmo corriente del mes: <strong>{formatCurrency(monthlyMetrics.dailyAverage)} / día</strong></span>
              <span>{monthlyMetrics.daysActive} días transcurridos</span>
            </div>
          </div>

          {monthlyCategoryProgress.length > 0 && (
            <CategoryGoalsSection
              title="Metas Mensuales por Rubro"
              items={monthlyCategoryProgress}
              allCategories={allCategories}
            />
          )}
        </>
      )}

      {/* ==================== VISTA: POR SEMANA ==================== */}
      {activeTab === 'weekly' && (
        <>
          <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Semana en Curso</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Lunes a Domingo</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(weeklyMetrics.spentThisWeek)}
                  </span>
                  {weeklyMetrics.weeklyLimit && (
                    <span className="text-[11px] font-medium text-slate-400">
                      / {formatCurrency(weeklyMetrics.weeklyLimit)}
                    </span>
                  )}
                </div>
                {weeklyMetrics.weeklyLimit && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {weeklyMetrics.percentage.toFixed(0)}% del límite
                  </span>
                )}
              </div>
            </div>

            {weeklyMetrics.weeklyLimit ? (
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
                      <AlertTriangle className="w-3.5 h-3.5" />
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
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Sin límite semanal global fijado</span>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
                  >
                    Fijar límite
                  </button>
                )}
              </div>
            )}
          </div>

          {weeklyCategoryProgress.length > 0 && (
            <CategoryGoalsSection
              title="Metas Semanales por Rubro"
              items={weeklyCategoryProgress}
              allCategories={allCategories}
            />
          )}
        </>
      )}

      {/* ==================== VISTA: PERSONALIZADO (N DÍAS) ==================== */}
      {activeTab === 'custom' && (
        <>
          <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Últimos {customGoalDays} días</h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Ventana personalizada móvil
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(customMetrics.spent)}
                  </span>
                  {customMetrics.limit && (
                    <span className="text-[11px] font-medium text-slate-400">
                      / {formatCurrency(customMetrics.limit)}
                    </span>
                  )}
                </div>
                {customMetrics.limit && (
                  <span className="text-[10px] font-bold text-slate-400">
                    {customMetrics.percentage.toFixed(0)}% del límite
                  </span>
                )}
              </div>
            </div>

            {customMetrics.limit ? (
              <div className="flex flex-col gap-1.5">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      customMetrics.isOver
                        ? 'bg-rose-500'
                        : customMetrics.isWarning
                        ? 'bg-amber-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, customMetrics.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  {customMetrics.isOver ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Excedido por {formatCurrency(Math.abs(customMetrics.remaining))}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      Disponible: <strong className="text-slate-800">{formatCurrency(customMetrics.remaining)}</strong>
                    </span>
                  )}

                  <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                    Ritmo: {formatCurrency(customMetrics.dailyAverage)} / día
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Sin límite fijado para {customGoalDays} días</span>
                {onNavigateToSettings && (
                  <button
                    type="button"
                    onClick={onNavigateToSettings}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] cursor-pointer"
                  >
                    Fijar límite en Ajustes
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Gasto promedio diario: <strong>{formatCurrency(customMetrics.dailyAverage)} / día</strong></span>
              {onNavigateToSettings && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Cambiar cantidad de días ({customGoalDays}d)
                </button>
              )}
            </div>
          </div>

          {customCategoryProgress.length > 0 && (
            <CategoryGoalsSection
              title={`Metas (${customGoalDays}d) por Rubro`}
              items={customCategoryProgress}
              allCategories={allCategories}
            />
          )}
        </>
      )}
    </div>
  );
}

interface EmptyGoalNoticeProps {
  title: string;
  subtitle: string;
  onNavigateToSettings?: () => void;
}

function EmptyGoalNotice({ title, subtitle, onNavigateToSettings }: EmptyGoalNoticeProps) {
  return (
    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">{title}</span>
          <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
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

interface CategoryGoalsSectionProps {
  title: string;
  items: Array<{
    categoryId: CategoryId;
    spent: number;
    weeklyBudget?: number;
    budget?: number;
    percentage: number;
    isOver: boolean;
    isWarning: boolean;
    remaining?: number;
    dailyAllowance?: number;
  }>;
  allCategories: Array<{
    id: CategoryId;
    name: string;
    icon: string;
    badgeBg: string;
    color: string;
  }>;
}

function CategoryGoalsSection({ title, items, allCategories }: CategoryGoalsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[9px] font-semibold text-slate-400">
          {items.length} rubro{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const cat = allCategories.find((c) => c.id === item.categoryId);
          if (!cat) return null;
          const targetBudget = item.weeklyBudget ?? item.budget ?? 0;
          const rem = item.remaining ?? targetBudget - item.spent;

          return (
            <div
              key={item.categoryId}
              className="flex flex-col gap-1 bg-slate-50/60 p-2 rounded-xl border border-slate-100"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center ${cat.badgeBg} ${cat.color}`}
                  >
                    <CategoryIcon name={cat.icon} className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="font-bold text-slate-800">{formatCurrency(item.spent)}</span>
                  <span className="text-slate-400">/ {formatCurrency(targetBudget)}</span>
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
                    <strong className="text-rose-600">
                      Excedido por {formatCurrency(Math.abs(rem))}
                    </strong>
                  ) : (
                    <span>
                      Disponible: <strong className="text-slate-600">{formatCurrency(rem)}</strong>
                    </span>
                  )}
                </span>
                {item.dailyAllowance && item.dailyAllowance > 0 && (
                  <span className="text-sky-700 font-semibold">
                    {formatCurrency(item.dailyAllowance)}/día
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
