import { useState } from 'react';
import { Expense, FinancialMetrics, PeriodFilterState } from '../../store/types';
import { generateWhatsAppReport, downloadExpensesCSV } from '../../utils/export';
import { useToastStore } from '../../store/useToastStore';
import { STRINGS } from '../../constants/strings';
import { Button } from '../ui/Button';
import { BottomSheet } from '../ui/BottomSheet';
import { Copy, Download, MessageSquare, FileSpreadsheet } from 'lucide-react';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  filter: PeriodFilterState;
  metrics: FinancialMetrics;
}

export function ExportPanel({
  isOpen,
  onClose,
  expenses,
  filter,
  metrics,
}: ExportPanelProps) {
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'csv'>('whatsapp');

  const reportText = generateWhatsAppReport(expenses, filter, metrics);

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      showToast(STRINGS.TOAST_COPIED_TO_CLIPBOARD, 'success');
    } catch {
      // Fallback para entornos donde clipboard API falle
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
    downloadExpensesCSV(expenses, filter);
    showToast(STRINGS.TOAST_CSV_DOWNLOADED, 'success');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={STRINGS.EXPORT_TITLE}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          {STRINGS.EXPORT_SUBTITLE}
        </p>

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
                Formato estándar con codificación UTF-8 BOM
              </span>
              <p>
                Este archivo incluye todas las columnas (Fecha, Tipo, Monto, Categoría, Detalle y Estado de Transferencia) preparadas para abrir directamente en Microsoft Excel o Google Sheets sin errores de caracteres.
              </p>
              <span className="font-semibold text-indigo-700">
                Total de filas a exportar: {expenses.length}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleDownloadCSV}
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center gap-2"
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

