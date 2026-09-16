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
import { NewPeriodModal } from './components/period/NewPeriodModal';
import { EditPeriodModal } from './components/period/EditPeriodModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Toaster } from './components/ui/Toaster';
import { useExpenseStore } from './store/useExpenseStore';
import { useFilterStore } from './store/useFilterStore';
import { usePeriodStore } from './store/usePeriodStore';
import { useAuthStore } from './store/useAuthStore';
import { useSyncStore } from './store/useSyncStore';
import { useToastStore } from './store/useToastStore';
import { calculateMetrics } from './utils/metrics';
import { isExpenseMatchingFilter } from './utils/date';
import { Expense, Period } from './store/types';
import { STRINGS } from './constants/strings';

export default function App() {
  const {
    expenses,
    deleteExpense,
    markAllPendingAsTransferred,
    toggleTransferred,
  } = useExpenseStore();

  const { activeFilter, setFilterType } = useFilterStore();
  const {
    setActivePeriodId,
    getActivePeriod,
    undoLastCutoff,
    deletePeriod,
  } = usePeriodStore();

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
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [isConfirmUndoCutoffOpen, setIsConfirmUndoCutoffOpen] = useState(false);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Estados para diálogos de confirmación accesibles (sin window.confirm)
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmTransferOpen, setIsConfirmTransferOpen] = useState(false);

  // Período activo actualmente seleccionado
  const activePeriod = getActivePeriod();

  // Filtrado de gastos para el período activo
  const filteredExpenses = expenses.filter((e) =>
    isExpenseMatchingFilter(e, activeFilter, activePeriod)
  );

  // Cálculo reactivo de métricas sobre el período seleccionado
  const metrics = calculateMetrics(expenses, activeFilter, activePeriod);

  // Manejo de altas y edición de gastos
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

  // Manejo de eliminación de gasto con ConfirmDialog
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

  // Manejo de períodos
  const handlePeriodCreated = (newPeriod: Period) => {
    setActivePeriodId(newPeriod.id);
    setFilterType('custom_period');
  };

  const handleConfirmUndoCutoff = () => {
    const res = undoLastCutoff();
    if (res.success) {
      showToast(STRINGS.TOAST_PERIOD_UNDO_SUCCESS, 'success');
    }
    setIsConfirmUndoCutoffOpen(false);
  };

  const handleConfirmDeletePeriod = () => {
    if (deletingPeriodId) {
      deletePeriod(deletingPeriodId);
      showToast('Período eliminado.', 'info');
      setDeletingPeriodId(null);
    }
  };

  // Fecha predeterminada si se agrega un gasto dentro de un período histórico cerrado
  const defaultExpenseDate = activePeriod?.endDate ?? undefined;

  return (
    <Layout>
      <Header
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1 px-4 py-4 flex flex-col">
        {/* Selector de Períodos: Ciclos abiertos / cerrados / históricos */}
        <PeriodFilter
          onOpenNewPeriod={() => setIsNewPeriodOpen(true)}
          onOpenEditPeriod={() => setIsEditPeriodOpen(true)}
          onUndoCutoff={() => setIsConfirmUndoCutoffOpen(true)}
        />

        {/* Bloque Superior de Métricas (incluye Métrica Estrella y botón de transferencia) */}
        <SummaryCards
          metrics={metrics}
          onTransferClick={handleTransferClick}
        />

        {/* Historial Agrupado por Fecha */}
        <ExpenseHistory
          expenses={filteredExpenses}
          period={activePeriod}
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
        defaultDate={defaultExpenseDate}
      />

      {/* Panel de Rendición y Exportación para WhatsApp y CSV */}
      <ExportPanel
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        expenses={expenses}
        filter={activeFilter}
        metrics={metrics}
        period={activePeriod}
      />

      {/* Modal de Autenticación y Sincronización */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Modal de Nuevo Período / Reinicio de Contadores */}
      <NewPeriodModal
        isOpen={isNewPeriodOpen}
        onClose={() => setIsNewPeriodOpen(false)}
        onCreated={handlePeriodCreated}
      />

      {/* Modal de Edición de Período Activo */}
      <EditPeriodModal
        isOpen={isEditPeriodOpen}
        onClose={() => setIsEditPeriodOpen(false)}
        period={activePeriod}
        onDeleteRequest={(id) => setDeletingPeriodId(id)}
      />

      {/* Modal accesible para confirmar eliminación de gasto */}
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

      {/* Modal accesible para confirmar deshacer corte de período */}
      <ConfirmDialog
        isOpen={isConfirmUndoCutoffOpen}
        title={STRINGS.CONFIRM_UNDO_CUTOFF_TITLE}
        message={STRINGS.CONFIRM_UNDO_CUTOFF_MSG}
        confirmLabel={STRINGS.CONFIRM_UNDO_CUTOFF_BUTTON}
        cancelLabel={STRINGS.CONFIRM_UNDO_CUTOFF_CANCEL}
        onConfirm={handleConfirmUndoCutoff}
        onCancel={() => setIsConfirmUndoCutoffOpen(false)}
      />

      {/* Modal accesible para confirmar eliminación de período */}
      <ConfirmDialog
        isOpen={Boolean(deletingPeriodId)}
        title="¿Eliminar este período?"
        message="Se eliminará este ciclo. Los gastos que contenía seguirán existiendo en tu historial general."
        confirmLabel="Sí, eliminar período"
        cancelLabel="Cancelar"
        isDestructive
        onConfirm={handleConfirmDeletePeriod}
        onCancel={() => setDeletingPeriodId(null)}
      />

      {/* Contenedor de notificaciones Toast */}
      <Toaster />
    </Layout>
  );
}
