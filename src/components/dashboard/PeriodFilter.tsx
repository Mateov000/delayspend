import { useFilterStore } from '../../store/useFilterStore';
import { PeriodFilterType } from '../../store/types';
import { STRINGS } from '../../constants/strings';

export function PeriodFilter() {
  const { activeFilter, setFilterType } = useFilterStore();

  const options: { type: PeriodFilterType; label: string }[] = [
    { type: 'current_month', label: STRINGS.FILTER_CURRENT_MONTH },
    { type: 'previous_month', label: STRINGS.FILTER_PREVIOUS_MONTH },
    { type: 'all', label: STRINGS.FILTER_ALL },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl mb-3.5">
      {options.map((opt) => {
        const isActive = activeFilter.type === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => setFilterType(opt.type)}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

