import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { PeriodFilter } from './components/dashboard/PeriodFilter';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ExpenseHistory } from './components/history/ExpenseHistory';
import { FloatingActionButton } from './components/form/FloatingActionButton';
import { AddExpenseSheet } from './components/form/AddExpenseSheet';
import { ExportPanel } from './components/export/ExportPanel';
import { AuthModal } from './components/auth/AuthModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Toaster } from './components/ui/Toaster';
import { useExpenseStore } from './store/useExpenseStore';
import { useFilterStore } from './store/useFilterStore';
import { useAuthStore } from './store/useAuthStore';
import { useSyncStore } from './store/useSyncStore';
import { useToastStore } from './store/useToastStore';
import { calculateMetrics } from './utils/metrics';
import { isWithinPeriod } from './utils/date';
import { Expense } from './store/types';
import { STRINGS } from './constants/strings';

export default function App() {
  const {
    expenses,
    deleteExpense,
    markAllPendingAsTransferred,
    toggleTransferred,
  } = useExpenseStore();

  const { activeFilter } = useFilterStore();
  const { user, initialize: initAuth } = useAuthStore();
  const { initializeSync } = useSyncStore();
  const { showToast } = useToastStore();

  // Inicializar listener de autenticación
  useEffect(() => {
    const unsubAuth = initAuth();
    return () => unsubAuth();
  }, [initAuth]);

  // Inicializar sincronización en la nube cuando cambie el usuario
  useEffect(() => {
    (window as unknown as { __delayspend_current_user_id?: string }).__delayspend_current_user_id = user?.id;
    const unsubSync = initializeSync(user?.id ?? null);
    return () => unsubSync();
  }, [user?.id, initializeSync]);

  // Estados de modales
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Estados para diálogos de confirmación accesibles (sin window.confirm)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);

  // Filtrado de gastos para el período activo
  const filteredExpenses = expenses.filter((e) => isWithinPeriod(e.date, activeFilter));

  // Cálculo reactivo de métricas sobre el período seleccionado
  const metrics = calculateMetrics(expenses, activeFilter);

  // Manejo de altas y edición
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsAddSheetOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsAddSheetOpen(false);
    setEditingExpense(null);
  };

  // Manejo de eliminación con ConfirmDialog
  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteExpense(deletingId);
      showToast(STRINGS.TOAST_EXPENSE_DELETED, 'info');
      setDeletingId(null);
    }
  };

  // Manejo de transferencia masiva a ahorro (Métrica estrella)
  const handleTransferClick = () => {
    setIsConfirmTransferOpen(true);
  };

  const handleConfirmTransfer = () => {
    markAllPendingAsTransferred();
    showToast(STRINGS.TOAST_TRANSFERRED_ALL_SUCCESS, 'success');
    setIsConfirmTransferOpen(false);
  };

  // Toggle individual de transferencia en el historial
  const handleToggleTransfer = (id: string) => {
    toggleTransferred(id);
    showToast(STRINGS.TOAST_TRANSFER_TOGGLED, 'info');
  };

  return (
    <Layout>
      <Header
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 px-4 py-4 flex flex-col">
        {/* Selector de Períodos: Este mes / Mes anterior / Todo */}
        <PeriodFilter />

        {/* Bloque Superior de Métricas (incluye Métrica Estrella y botón de transferencia) */}
        <SummaryCards
          metrics={metrics}
          onTransferClick={handleTransferClick}
        />

        {/* Historial Agrupado por Fecha */}
        <ExpenseHistory
          expenses={filteredExpenses}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onToggleTransfer={handleToggleTransfer}
        />
      </main>

      {/* Botón flotante accesible con una mano en 375px */}
      <FloatingActionButton onClick={handleOpenAdd} />

      {/* Modal BottomSheet para alta y edición de gastos */}
      <AddExpenseSheet
        isOpen={isAddSheetOpen}
        onClose={handleCloseSheet}
        editingExpense={editingExpense}
      />

      {/* Panel de Rendición y Exportación para WhatsApp y CSV */}
      <ExportPanel
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        expenses={expenses}
        filter={activeFilter}
        metrics={metrics}
      />

      {/* Modal de Autenticación y Sincronización */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Modal accesible para confirmar eliminación (Cero window.confirm) */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title={STRINGS.CONFIRM_DELETE_TITLE}
        message={STRINGS.CONFIRM_DELETE_MSG}
        confirmLabel={STRINGS.CONFIRM_DELETE_BUTTON}
        cancelLabel={STRINGS.CONFIRM_DELETE_CANCEL}
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />

      {/* Modal accesible para confirmar transferencia a ahorro */}
      <ConfirmDialog
        isOpen={isConfirmTransferOpen}
        title={STRINGS.CONFIRM_TRANSFER_ALL_TITLE}
        message={STRINGS.CONFIRM_TRANSFER_ALL_MSG}
        confirmLabel={STRINGS.CONFIRM_TRANSFER_ALL_BUTTON}
        cancelLabel={STRINGS.CONFIRM_TRANSFER_ALL_CANCEL}
        onConfirm={handleConfirmTransfer}
        onCancel={() => setIsConfirmTransferOpen(false)}
      />

      {/* Contenedor de notificaciones Toast */}
      <Toaster />
    </Layout>
  );
}
