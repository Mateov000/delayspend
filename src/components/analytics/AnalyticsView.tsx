import { useMemo } from 'react';
import { Expense, Period, PeriodFilterState } from '../../store/types';
import { HistoricalSavingsCard } from './HistoricalSavingsCard';
import { CategoryDonutChart } from './CategoryDonutChart';
import { PeriodBarChart } from './PeriodBarChart';
import { calculateHistoricalSavings } from '../../utils/historicalSavings';
import { isExpenseMatchingFilter } from '../../utils/date';
import { PiggyBank, PieChart, BarChart2 } from 'lucide-react';

interface AnalyticsViewProps {
  expenses: Expense[];
  periods: Period[];
  activeFilter: PeriodFilterState;
  activePeriod: Period | null;
}

export function AnalyticsView({
  expenses,
  periods,
  activeFilter,
  activePeriod,
}: AnalyticsViewProps) {
  const historicalSavings = useMemo(
    () => calculateHistoricalSavings(expenses, periods),
    [expenses, periods]
  );

  // Gastos del período activo para el donut de categorías
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isExpenseMatchingFilter(e, activeFilter, activePeriod)),
    [expenses, activeFilter, activePeriod]
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      {/* Sección 1: Ahorro histórico acumulado */}
      <section aria-label="Ahorro acumulado histórico">
        <SectionHeader icon={<PiggyBank className="w-4 h-4" />} title="Ahorro acumulado" />
        <div className="mt-3">
          <HistoricalSavingsCard savings={historicalSavings} />
        </div>
      </section>

      {/* Sección 2: Distribución por categoría */}
      <section aria-label="Distribución de gastos por categoría">
        <SectionHeader
          icon={<PieChart className="w-4 h-4" />}
          title="Distribución por categoría"
          subtitle={activePeriod ? activePeriod.name : 'Período seleccionado'}
        />
        <div className="mt-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <CategoryDonutChart expenses={filteredExpenses} />
        </div>
      </section>

      {/* Sección 3: Comparativa entre períodos */}
      {periods.length > 0 && (
        <section aria-label="Comparativa entre períodos">
          <SectionHeader
            icon={<BarChart2 className="w-4 h-4" />}
            title="Comparativa de períodos"
            subtitle="Gastado real vs DelaySpend"
          />
          <div className="mt-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <PeriodBarChart expenses={expenses} periods={periods} />
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

