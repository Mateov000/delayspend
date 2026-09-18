import { useState, useEffect } from 'react';
import { Expense, FinancialMetrics, Period, PeriodFilterState, ExpenseNature } from '../../store/types';
import { generateWhatsAppReport, downloadExpensesCSV, ParentExportConfig } from '../../utils/export';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { Button } from '../ui/Button';
import { BottomSheet } from '../ui/BottomSheet';
import { Copy, Download, MessageSquare, FileSpreadsheet, Settings } from 'lucide-react';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  filter: PeriodFilterState;
  metrics: FinancialMetrics;
  period?: Period | null;
}

const STORAGE_KEY = 'delayspend_parent_export_config_v1';

const DEFAULT_CONFIG: ParentExportConfig = {
  showCategory: true,
  showNature: true,
  showNatureTags: {
    daily: true,
    fixed: true,
    eventual: true,
    house: true,
  },
  includedNatures: {
    daily: true,
    fixed: true,
    eventual: true,
    house: true,
  },
  summaryMode: 'full',
};

function loadStoredConfig(): ParentExportConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      showCategory: typeof parsed.showCategory === 'boolean' ? parsed.showCategory : true,
      showNature: typeof parsed.showNature === 'boolean' ? parsed.showNature : true,
      showNatureTags: {
        daily: parsed.showNatureTags?.daily ?? true,
        fixed: parsed.showNatureTags?.fixed ?? true,
        eventual: parsed.showNatureTags?.eventual ?? true,
        house: parsed.showNatureTags?.house ?? true,
      },
      includedNatures: {
        daily: parsed.includedNatures?.daily ?? true,
        fixed: parsed.includedNatures?.fixed ?? true,
        eventual: parsed.includedNatures?.eventual ?? true,
        house: parsed.includedNatures?.house ?? true,
      },
      summaryMode: parsed.summaryMode === 'total_only' ? 'total_only' : 'full',
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function ExportPanel({
  isOpen,
  onClose,
  expenses,
  filter,
  metrics,
  period,
}: ExportPanelProps) {
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'csv'>('whatsapp');
  const [isUnified, setIsUnified] = useState(true);

  // Configuración del reporte para padres (persistida en localStorage)
  const [config, setConfig] = useState<ParentExportConfig>(loadStoredConfig);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Guardar configuración automáticamente cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignorar errores de quota de localStorage
    }
  }, [config]);

  const updateConfig = (patch: Partial<ParentExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const toggleIncludedNature = (nature: ExpenseNature) => {
    setConfig((prev) => {
      const current = prev.includedNatures ?? DEFAULT_CONFIG.includedNatures!;
      return {
        ...prev,
        includedNatures: { ...current, [nature]: !current[nature] },
      };
    });
  };

  const toggleNatureTag = (nature: ExpenseNature) => {
    setConfig((prev) => {
      const current = prev.showNatureTags ?? DEFAULT_CONFIG.showNatureTags!;
      return {
        ...prev,
        showNatureTags: { ...current, [nature]: !current[nature] },
      };
    });
  };

  const reportText = generateWhatsAppReport(expenses, filter, metrics, {
    unified: isUnified,
    period,
    ...config,
  });

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      showToast(STRINGS.TOAST_COPIED_TO_CLIPBOARD, 'success');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reportText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(STRINGS.TOAST_COPIED_TO_CLIPBOARD, 'success');
    }
  };

  const handleDownloadCSV = () => {
    downloadExpensesCSV(expenses, filter, {
      unified: isUnified,
      period,
      ...config,
    });
    showToast(STRINGS.TOAST_CSV_DOWNLOADED, 'success');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={STRINGS.EXPORT_TITLE}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">{STRINGS.EXPORT_SUBTITLE}</p>

        {/* Bloque: Toggle de Rendición Unificada + Tuerquita ⚙️ */}
        <div className="flex flex-col gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col pr-2">
              <span className="text-xs font-bold text-slate-800">
                {STRINGS.EXPORT_UNIFY_LABEL}
              </span>
              <span className="text-[11px] text-slate-500 leading-snug mt-0.5">
                {STRINGS.EXPORT_UNIFY_DESC}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botón Tuerquita de Configuración */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                title="Configurar campos del reporte"
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 hover:text-indigo-600 border-indigo-200/80 hover:bg-indigo-50'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Switch Unificado */}
              <button
                type="button"
                role="switch"
                aria-checked={isUnified}
                onClick={() => setIsUnified(!isUnified)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isUnified ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isUnified ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Menú Desplegable de Configuración de Opciones del Reporte */}
          {isSettingsOpen && (
            <div className="pt-3 mt-1 border-t border-indigo-100/90 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Opciones de personalización
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">
                  Se guardan automáticamente
                </span>
              </div>

              {/* 1. Casilla: Mostrar u Ocultar Categoría */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                <input
                  type="checkbox"
                  checked={config.showCategory ?? true}
                  onChange={(e) => updateConfig({ showCategory: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 text-xs">
                    Mostrar categoría en cada gasto
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Aplica la censura de privacidad configurada (ej: Estética aparece como Otros Gastos).
                  </span>
                </div>
              </label>

              {/* 2. Recuadro: Mostrar u Ocultar Naturaleza y Selección de Etiquetas */}
              <div className="flex flex-col gap-2.5 bg-white p-2.5 rounded-xl border border-indigo-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.showNature ?? true}
                    onChange={(e) => updateConfig({ showNature: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-xs">
                      Mostrar etiqueta de naturaleza
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Indica si el gasto es para la casa, fijo, eventual o cotidiano.
                    </span>
                  </div>
                </label>

                {/* Sub-opciones: De qué naturaleza mostrar etiquetas (dentro del mismo recuadro) */}
                <div
                  className={`flex flex-col gap-1.5 pl-6 pt-2 border-t border-slate-100 transition-opacity ${
                    !(config.showNature ?? true) ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <span className="font-medium text-slate-700 text-[11px]">
                    Etiquetas de naturaleza a mostrar:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Elegí de qué naturalezas mostrar etiqueta. Aunque no se muestre la etiqueta, el gasto aparece igual en el reporte.
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.showNatureTags?.daily ?? true}
                        onChange={() => toggleNatureTag('daily')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>🛒 Cotidianos</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.showNatureTags?.fixed ?? true}
                        onChange={() => toggleNatureTag('fixed')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>🔄 Fijos / Recurrentes</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.showNatureTags?.eventual ?? true}
                        onChange={() => toggleNatureTag('eventual')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>⚡ Eventuales</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={config.showNatureTags?.house ?? true}
                        onChange={() => toggleNatureTag('house')}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>🏠 Para la casa</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Naturalezas a incluir en el reporte */}
              <div className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="font-semibold text-slate-800 text-xs">
                  Naturalezas a incluir en el reporte:
                </span>
                <span className="text-[10px] text-slate-400">
                  Elegí qué gastos incluir según su naturaleza. Si desmarcás una, esos gastos no figurarán en el reporte ni en el total a rendir.
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.includedNatures?.daily ?? true}
                      onChange={() => toggleIncludedNature('daily')}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>🛒 Cotidianos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.includedNatures?.fixed ?? true}
                      onChange={() => toggleIncludedNature('fixed')}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>🔄 Fijos / Recurrentes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.includedNatures?.eventual ?? true}
                      onChange={() => toggleIncludedNature('eventual')}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>⚡ Eventuales</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.includedNatures?.house ?? true}
                      onChange={() => toggleIncludedNature('house')}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>🏠 Para la casa</span>
                  </label>
                </div>
              </div>

              {/* 4. Modo de Resumen Financiero */}
              <div className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="font-semibold text-slate-800 text-xs">
                  Resumen financiero al final:
                </span>
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="radio"
                      name="summaryMode"
                      checked={config.summaryMode !== 'total_only'}
                      onChange={() => updateConfig({ summaryMode: 'full' })}
                      className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Detalle completo (ingresos, total a rendir y saldo remanente)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-700">
                    <input
                      type="radio"
                      name="summaryMode"
                      checked={config.summaryMode === 'total_only'}
                      onChange={() => updateConfig({ summaryMode: 'total_only' })}
                      className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Solo decir el total final a rendir</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selector de Pestañas */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>{STRINGS.EXPORT_TAB_WHATSAPP}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>{STRINGS.EXPORT_TAB_CSV}</span>
          </button>
        </div>

        {/* Contenido Pestaña WhatsApp */}
        {activeTab === 'whatsapp' && (
          <div className="flex flex-col gap-3">
            <span className="text-[11px] text-slate-500 font-medium">
              {STRINGS.EXPORT_WHATSAPP_HINT}
            </span>

            <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {reportText}
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleCopyWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>{STRINGS.EXPORT_WHATSAPP_COPY_BUTTON}</span>
            </Button>
          </div>
        )}

        {/* Contenido Pestaña CSV */}
        {activeTab === 'csv' && (
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isUnified
                  ? 'Formato unificado con codificación UTF-8 BOM'
                  : 'Formato estándar con codificación UTF-8 BOM'}
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isUnified
                  ? STRINGS.EXPORT_CSV_UNIFIED_DESC
                  : 'Este archivo incluye todas las columnas preparadas para abrir directamente en Microsoft Excel o Google Sheets sin errores de caracteres.'}
              </p>
              <span className="font-semibold text-indigo-700">
                Total de filas a exportar: {expenses.length}
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{STRINGS.EXPORT_CSV_DOWNLOAD_BUTTON}</span>
            </Button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
