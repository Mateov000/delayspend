import { PiggyBank, Share2, Cloud, Check, RefreshCw, WifiOff, Bell } from 'lucide-react';
import { STRINGS } from '../../constants/strings';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useReminderStore } from '../../store/useReminderStore';
import { useToastStore } from '../../store/useToastStore';

interface HeaderProps {
  onOpenExport?: () => void;
  onOpenAuth?: () => void;
  onOpenReminders?: () => void;
}

export function Header({ onOpenExport, onOpenAuth, onOpenReminders }: HeaderProps) {
  const { user } = useAuthStore();
  const { status, lastError, syncAllWithCloud } = useSyncStore();
  const { showToast } = useToastStore();
  const dueCount = useReminderStore((state) => state.getDueReminders().length);

  const handleSyncRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth?.();
      return;
    }

    showToast('Sincronizando con la nube...', 'info');
    syncAllWithCloud(user.id);
  };

  const renderSyncBadge = () => {
    if (!user) {
      return (
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200/80"
          title="Sincronizá tus gastos entre tu celular y tu computadora"
        >
          <Cloud className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xs:inline text-[11px]">{STRINGS.SYNC_STATUS_GUEST}</span>
        </button>
      );
    }

    if (status === 'syncing') {
      return (
        <button
          type="button"
          onClick={handleSyncRetry}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 cursor-pointer"
          title="Sincronizando... Tocá para reintentar"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline text-[11px]">{STRINGS.SYNC_STATUS_SYNCING}</span>
        </button>
      );
    }

    if (status === 'offline') {
      return (
        <button
          type="button"
          onClick={handleSyncRetry}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 cursor-pointer"
          title={lastError ? `Sin conexión (${lastError}). Tocá para reintentar.` : 'Sin conexión. Tocá para reintentar sincronizar'}
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">{STRINGS.SYNC_STATUS_OFFLINE}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenAuth}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 cursor-pointer"
        title={`Conectado como ${user.email}. Tocá para ver opciones de cuenta`}
      >
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline text-[11px]">{STRINGS.SYNC_STATUS_SYNCED}</span>
      </button>
    );
  };

  return (
    <header className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-slate-200/60 bg-white sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <PiggyBank className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {STRINGS.APP_NAME}
          </h1>
          <p className="text-[11px] font-medium text-slate-500 leading-tight">
            {STRINGS.APP_TAGLINE}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenReminders && (
          <button
            type="button"
            onClick={onOpenReminders}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200/80"
            title="Recordatorios de gastos"
            aria-label="Recordatorios de gastos"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-black border-2 border-white animate-pulse">
                {dueCount}
              </span>
            )}
          </button>
        )}

        {renderSyncBadge()}

        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 transition-colors cursor-pointer border border-indigo-200/60"
            aria-label={STRINGS.EXPORT_BUTTON}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{STRINGS.EXPORT_BUTTON}</span>
          </button>
        )}
      </div>
    </header>
  );
}
