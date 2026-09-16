import { useState } from 'react';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useFilterStore } from '../../store/useFilterStore';
import { STRINGS } from '../../constants/strings';
import { formatDayMonth } from '../../utils/format';
import { RotateCcw, Undo2, PlusCircle, Edit3, ChevronDown, Calendar } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';

interface PeriodFilterProps {
  onOpenNewPeriod: () => void;
  onOpenEditPeriod: () => void;
  onUndoCutoff: () => void;
}

export function PeriodFilter({
  onOpenNewPeriod,
  onOpenEditPeriod,
  onUndoCutoff,
}: PeriodFilterProps) {
  const { periods, activePeriodId, setActivePeriodId } = usePeriodStore();
  const { activeFilter, setFilterType } = useFilterStore();
  const [isPastPeriodsOpen, setIsPastPeriodsOpen] = useState(false);

  // Encontrar período actualmente abierto y períodos cerrados
  const openPeriod = periods.find((p) => p.endDate === null) ?? null;
  const closedPeriods = periods.filter((p) => p.endDate !== null);

  // Período activo actualmente seleccionado
  const selectedPeriod = periods.find((p) => p.id === activePeriodId) ?? null;
  const isViewingOpenPeriod = selectedPeriod && selectedPeriod.endDate === null;
  const isViewingPastPeriod = selectedPeriod && selectedPeriod.endDate !== null;

  // Se puede deshacer el corte si estamos en el período abierto y existe al menos 1 período anterior
  const canUndoCutoff = isViewingOpenPeriod && closedPeriods.length > 0;

  // Manejo cuando se selecciona un período específico
  const handleSelectPeriod = (periodId: string) => {
    setActivePeriodId(periodId);
    setFilterType('custom_period');
    setIsPastPeriodsOpen(false);
  };

  const handleSelectAll = () => {
    setActivePeriodId('all');
    setFilterType('all');
    setIsPastPeriodsOpen(false);
  };

  // Si no hay períodos personalizados creados todavía
  if (periods.length === 0) {
    return (
      <div className="flex flex-col gap-2 mb-3.5">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('current_month')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeFilter.type === 'current_month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {STRINGS.FILTER_CURRENT_MONTH}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('previous_month')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeFilter.type === 'previous_month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {STRINGS.FILTER_PREVIOUS_MONTH}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              activeFilter.type === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {STRINGS.FILTER_ALL}
          </button>
        </div>

        {/* Botón para iniciar el primer período / corte */}
        <button
          type="button"
          onClick={onOpenNewPeriod}
          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-200/80 text-indigo-700 rounded-xl border border-indigo-200/70 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{STRINGS.PERIOD_NEW_BUTTON}</span>
        </button>
      </div>
    );
  }

  // Cuando ya existen períodos personalizados
  return (
    <div className="flex flex-col gap-2 mb-3.5">
      {/* Barra de Navegación de Ciclos */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
        {/* 1. Período Actual */}
        {openPeriod && (
          <button
            type="button"
            onClick={() => handleSelectPeriod(openPeriod.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              isViewingOpenPeriod && activeFilter.type === 'custom_period'
                ? 'bg-white text-indigo-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{openPeriod.name}</span>
          </button>
        )}

        {/* 2. Selector de Ciclos Anteriores */}
        {closedPeriods.length > 0 && (
          <button
            type="button"
            onClick={() => setIsPastPeriodsOpen(true)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              isViewingPastPeriod && activeFilter.type === 'custom_period'
                ? 'bg-white text-indigo-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate">
              {isViewingPastPeriod ? selectedPeriod.name : STRINGS.PERIOD_NAV_PAST}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        )}

        {/* 3. Todo el Historial */}
        <button
          type="button"
          onClick={handleSelectAll}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            activeFilter.type === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {STRINGS.PERIOD_NAV_ALL}
        </button>
      </div>

      {/* Banner y Acciones de Período */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        {selectedPeriod ? (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium truncate">
            <span className="text-slate-700 font-bold truncate">{selectedPeriod.name}:</span>
            <span className="truncate">
              {formatDayMonth(selectedPeriod.startDate)} al{' '}
              {selectedPeriod.endDate ? formatDayMonth(selectedPeriod.endDate) : 'presente'}
            </span>
            <button
              type="button"
              onClick={onOpenEditPeriod}
              title={STRINGS.PERIOD_EDIT_BUTTON}
              className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-slate-500 font-medium">Historial consolidado acumulado</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Botón Deshacer Corte si está en el período actual y hay anterior */}
          {canUndoCutoff && (
            <button
              type="button"
              onClick={onUndoCutoff}
              title={STRINGS.PERIOD_UNDO_CUTOFF_BUTTON}
              className="py-1 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{STRINGS.PERIOD_UNDO_CUTOFF_BUTTON}</span>
            </button>
          )}

          {/* Botón Nuevo Período / Reiniciar contadores */}
          <button
            type="button"
            onClick={onOpenNewPeriod}
            className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Nuevo período</span>
          </button>
        </div>
      </div>

      {/* Modal BottomSheet para seleccionar entre ciclos anteriores */}
      <BottomSheet
        isOpen={isPastPeriodsOpen}
        onClose={() => setIsPastPeriodsOpen(false)}
        title="Historial de Ciclos Anteriores"
      >
        <div className="flex flex-col gap-2.5 pb-2">
          <p className="text-xs text-slate-500 mb-1">
            Seleccioná un ciclo cerrado para ver sus gastos, métricas y rendición:
          </p>

          {closedPeriods.map((period) => {
            const isSelected = activePeriodId === period.id;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => handleSelectPeriod(period.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
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
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Ingreso</span>
                    <span className="text-xs font-black text-emerald-600">
                      ${period.initialIncome.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
