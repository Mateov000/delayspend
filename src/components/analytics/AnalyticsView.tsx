import { useState, useMemo } from 'react';
import { Expense, Period, PeriodFilterState } from '../../store/types';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useFilterStore } from '../../store/useFilterStore';
import { HistoricalSavingsCard } from './HistoricalSavingsCard';
import { CategoryDonutChart } from './CategoryDonutChart';
import { PeriodBarChart } from './PeriodBarChart';
import { BudgetGoalsCard } from './BudgetGoalsCard';
import { ExpenseNatureCard } from './ExpenseNatureCard';
import { calculateHistoricalSavings } from '../../utils/historicalSavings';
import { isExpenseMatchingFilter } from '../../utils/date';
import { formatDayMonth, formatCurrency } from '../../utils/format';
import { BottomSheet } from '../ui/BottomSheet';
import {
  PiggyBank,
  PieChart,
  BarChart2,
  Target,
  Layers,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
  ChevronDown,
} from 'lucide-react';

interface AnalyticsViewProps {
  expenses: Expense[];
  periods: Period[];
  activeFilter: PeriodFilterState;
  activePeriod: Period | null;
  onNavigateToSettings?: () => void;
}

export function AnalyticsView({
  expenses,
  periods,
  activeFilter,
  activePeriod,
  onNavigateToSettings,
}: AnalyticsViewProps) {
  const { setActivePeriodId } = usePeriodStore();
  const { setFilterType } = useFilterStore();
  const [isCycleSheetOpen, setIsCycleSheetOpen] = useState(false);

  const historicalSavings = useMemo(
    () => calculateHistoricalSavings(expenses, periods),
    [expenses, periods]
  );

  // Períodos disponibles
  const openPeriod = useMemo(
    () => periods.find((p) => p.endDate === null && !p.deletedAt) ?? null,
    [periods]
  );
  const closedPeriods = useMemo(
    () =>
      periods
        .filter((p) => p.endDate !== null && !p.deletedAt)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods]
  );

  // Gastos del período seleccionado para el donut y naturaleza
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isExpenseMatchingFilter(e, activeFilter, activePeriod)),
    [expenses, activeFilter, activePeriod]
  );

  // Handlers para cambiar de período
  const handleSelectPeriod = (periodId: string) => {
    setActivePeriodId(periodId);
    setFilterType('custom_period');
    setIsCycleSheetOpen(false);
  };

  const handleSelectAll = () => {
    setActivePeriodId('all');
    setFilterType('all');
    setIsCycleSheetOpen(false);
  };

  // Cálculo de ingresos e items del período en análisis
  const periodStats = useMemo(() => {
    if (activePeriod) {
      const extraIncomes = filteredExpenses
        .filter((e) => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = (activePeriod.initialIncome || 0) + extraIncomes;
      const expenseCount = filteredExpenses.filter((e) => e.type !== 'income').length;
      return { totalIncome, expenseCount, isAll: false };
    }

    const allInitialIncome = periods
      .filter((p) => !p.deletedAt)
      .reduce((sum, p) => sum + (p.initialIncome || 0), 0);
    const allExtraIncomes = expenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.filter((e) => e.type !== 'income').length;

    return {
      totalIncome: allInitialIncome + allExtraIncomes,
      expenseCount,
      isAll: true,
    };
  }, [activePeriod, filteredExpenses, periods, expenses]);

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Selector interactivo de período */}
      {periods.length > 0 && (
        <section aria-label="Selector de período a analizar" className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 leading-none">Período en análisis</h2>
                <span className="text-[10px] text-slate-400 font-medium">Elegí qué ciclo auditar</span>
              </div>
            </div>

            {/* Badge de estado del período seleccionado */}
            {activePeriod ? (
              activePeriod.endDate === null ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ciclo en curso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                  Ciclo cerrado
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Historial consolidado
              </span>
            )}
          </div>

          {/* Resumen dinámico del período seleccionado */}
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-bold text-slate-900 truncate">
                {activePeriod ? activePeriod.name : 'Historial consolidado'}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {activePeriod ? (
                  <>
                    {formatDayMonth(activePeriod.startDate)} al{' '}
                    {activePeriod.endDate ? formatDayMonth(activePeriod.endDate) : 'presente'}
                  </>
                ) : (
                  `${periods.filter((p) => !p.deletedAt).length} ciclos registrados`
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {periodStats.totalIncome > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Ingreso</span>
                  <span className="text-xs font-black text-emerald-600">
                    {formatCurrency(periodStats.totalIncome)}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase font-bold text-slate-400">Gastos</span>
                <span className="text-xs font-black text-slate-700">
                  {periodStats.expenseCount}
                </span>
              </div>
            </div>
          </div>

          {/* Fila de chips deslizables */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar -mx-0.5 px-0.5">
            {/* Período en curso */}
            {openPeriod && (
              <button
                type="button"
                onClick={() => handleSelectPeriod(openPeriod.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activePeriod?.id === openPeriod.id
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activePeriod?.id === openPeriod.id ? 'bg-emerald-300' : 'bg-emerald-500'
                  }`}
                />
                <span>{openPeriod.name}</span>
              </button>
            )}

            {/* Períodos cerrados (chips directos) */}
            {closedPeriods.map((period) => {
              const isSelected = activePeriod?.id === period.id;
              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => handleSelectPeriod(period.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{period.name}</span>
                  <span
                    className={`text-[10px] ${
                      isSelected ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    ({formatDayMonth(period.startDate)})
                  </span>
                </button>
              );
            })}

            {/* Todo el historial */}
            <button
              type="button"
              onClick={handleSelectAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                !activePeriod && activeFilter.type === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Todo el historial</span>
            </button>

            {/* Botón selector modal rápido si hay períodos cerrados */}
            {closedPeriods.length > 2 && (
              <button
                type="button"
                onClick={() => setIsCycleSheetOpen(true)}
                title="Ver lista completa de ciclos"
                className="px-2 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Modal BottomSheet para lista completa de ciclos */}
      <BottomSheet
        isOpen={isCycleSheetOpen}
        onClose={() => setIsCycleSheetOpen(false)}
        title="Seleccionar Período para Analíticas"
      >
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-xs text-slate-500 mb-1">
            Elegí qué período querés visualizar en todos los gráficos y métricas:
          </p>

          {/* Opción período actual si existe */}
          {openPeriod && (
            <button
              type="button"
              onClick={() => handleSelectPeriod(openPeriod.id)}
              className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                activePeriod?.id === openPeriod.id
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-900">{openPeriod.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    Actual
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium pl-4">
                  {formatDayMonth(openPeriod.startDate)} al presente
                </span>
              </div>
              {openPeriod.initialIncome > 0 && (
                <span className="text-xs font-black text-emerald-600">
                  ${openPeriod.initialIncome.toLocaleString('es-AR')}
                </span>
              )}
            </button>
          )}

          {/* Opciones ciclos cerrados */}
          {closedPeriods.map((period) => {
            const isSelected = activePeriod?.id === period.id;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => handleSelectPeriod(period.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{period.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      Cerrado
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDayMonth(period.startDate)} al{' '}
                    {period.endDate ? formatDayMonth(period.endDate) : ''}
                  </span>
                </div>
                {period.initialIncome > 0 && (
                  <span className="text-xs font-black text-slate-700">
                    ${period.initialIncome.toLocaleString('es-AR')}
                  </span>
                )}
              </button>
            );
          })}

          {/* Opción Todo el historial */}
          <button
            type="button"
            onClick={handleSelectAll}
            className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              !activePeriod && activeFilter.type === 'all'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Todo el historial consolidado</span>
              <span className="text-xs text-slate-500 font-medium">
                Incluye todos los ciclos y registros cargados
              </span>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Sección 1: Ahorro histórico acumulado */}
      <section aria-label="Ahorro acumulado histórico">
        <SectionHeader icon={<PiggyBank className="w-4 h-4" />} title="Ahorro acumulado" />
        <div className="mt-3">
          <HistoricalSavingsCard savings={historicalSavings} />
        </div>
      </section>

      {/* Sección 2: Seguimiento de Metas y Límites de Gasto */}
      <section aria-label="Seguimiento de metas y límites">
        <SectionHeader
          icon={<Target className="w-4 h-4" />}
          title="Metas y Límites de Gasto"
          subtitle={
            activePeriod
              ? `Ritmo y presupuesto de ${activePeriod.name}`
              : 'Ritmo actual del ciclo y metas semanales'
          }
        />
        <div className="mt-3">
          <BudgetGoalsCard
            expenses={expenses}
            activePeriod={activePeriod}
            onNavigateToSettings={onNavigateToSettings}
          />
        </div>
      </section>

      {/* Sección 3: Distribución por categoría */}
      <section aria-label="Distribución de gastos por categoría">
        <SectionHeader
          icon={<PieChart className="w-4 h-4" />}
          title="Distribución por categoría"
          subtitle={activePeriod ? activePeriod.name : 'Todo el historial'}
        />
        <div className="mt-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <CategoryDonutChart expenses={filteredExpenses} />
        </div>
      </section>

      {/* Sección 4: Auditoría por Naturaleza de Gasto */}
      <section aria-label="Composición por naturaleza de gasto">
        <SectionHeader
          icon={<Layers className="w-4 h-4" />}
          title="Naturaleza de Gasto"
          subtitle={
            activePeriod
              ? `Cotidianos vs Fijos vs Eventuales (${activePeriod.name})`
              : 'Cotidianos vs Fijos vs Eventuales (Historial completo)'
          }
        />
        <div className="mt-3">
          <ExpenseNatureCard expenses={filteredExpenses} />
        </div>
      </section>

      {/* Sección 5: Comparativa entre períodos */}
      {periods.length > 0 && (
        <section aria-label="Comparativa entre períodos">
          <SectionHeader
            icon={<BarChart2 className="w-4 h-4" />}
            title="Comparativa de períodos"
            subtitle="Hacé clic en cualquier período para auditarlo arriba"
          />
          <div className="mt-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <PeriodBarChart
              expenses={expenses}
              periods={periods}
              selectedPeriodId={activePeriod?.id ?? 'all'}
              onSelectPeriod={handleSelectPeriod}
            />
          </div>
        </section>
      )}

      {/* Espacio para la tab bar */}
      <div className="h-4" />
    </div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-slate-500">{icon}</span>
      <div>
        <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
        {subtitle && (
          <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
