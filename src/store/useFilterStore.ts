import { create } from 'zustand';
import { PeriodFilterState, PeriodFilterType } from './types';

interface FilterState {
  activeFilter: PeriodFilterState;
  setFilterType: (type: PeriodFilterType) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  activeFilter: {
    type: 'current_month',
  },
  setFilterType: (type: PeriodFilterType) => {
    set({
      activeFilter: { type },
    });
  },
}));

