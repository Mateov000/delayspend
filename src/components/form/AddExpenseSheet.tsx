import { BottomSheet } from '../ui/BottomSheet';
import { ExpenseForm } from './ExpenseForm';
import { Expense, ExpenseInput } from '../../store/types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { usePeriodStore } from '../../store/usePeriodStore';
import { useFilterStore } from '../../store/useFilterStore';
import { useToastStore } from '../../store/useToastStore';
import { findPeriodForDate } from '../../utils/date';
import { STRINGS } from '../../constants/strings';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: Expense | null;
  defaultDate?: string;
  defaultPeriodId?: string | null;
  initialPreset?: Partial<ExpenseInput> | null;
}

export function AddExpenseSheet({
  isOpen,
  onClose,
  editingExpense,
  defaultDate,
  defaultPeriodId,
  initialPreset,
}: AddExpenseSheetProps) {
  const { addExpense, updateExpense } = useExpenseStore();
  const { showToast } = useToastStore();
  const { periods, activePeriodId, setActivePeriodId } = usePeriodStore();
  const { setFilterType } = useFilterStore();

  const handleFormSubmit = (data: ExpenseInput) => {
    if (editingExpense) {
      const targetPeriod = findPeriodForDate(
        data.date,
        periods,
        data.periodId ?? editingExpense.periodId
      );
      const updatedData: ExpenseInput = {
        ...data,
        periodId: targetPeriod ? targetPeriod.id : null,
      };
      updateExpense(editingExpense.id, updatedData);
      showToast(STRINGS.TOAST_EXPENSE_UPDATED, 'info');
    } else {
      const targetPeriod = findPeriodForDate(
        data.date,
        periods,
        data.periodId ?? defaultPeriodId
      );
      const expenseData: ExpenseInput = {
        ...data,
        periodId: targetPeriod ? targetPeriod.id : null,
      };
      addExpense(expenseData);

      // Si el gasto pertenece a un período distinto al que se estaba visualizando,
      // conmutamos la vista hacia el período donde realmente cayó el gasto
      const isSwitchingPeriod =
        targetPeriod && activePeriodId !== 'all' && activePeriodId !== targetPeriod.id;
      if (isSwitchingPeriod) {
        setActivePeriodId(targetPeriod.id);
        setFilterType('custom_period');
      }

      const periodSuffix = isSwitchingPeriod ? ` en ${targetPeriod.name}` : '';

      if (data.isFictitious) {
        showToast(`🎭 Gasto ficticio registrado (máscara para padres)${periodSuffix}.`, 'success');
      } else if (data.savedExtraAmount && data.savedExtraAmount > 0) {
        showToast(`${STRINGS.TOAST_EXPENSE_ADDED_WITH_SAVINGS}${periodSuffix}`, 'success');
      } else if (data.type === 'delayed') {
        showToast(`${STRINGS.TOAST_EXPENSE_ADDED_DELAYED}${periodSuffix}`, 'success');
      } else if (data.type === 'income') {
        showToast(`💵 Ingreso registrado${periodSuffix}.`, 'success');
      } else {
        showToast(`${STRINGS.TOAST_EXPENSE_ADDED_REAL}${periodSuffix}`, 'success');
      }
    }
    onClose();
  };

  const initialValues: ExpenseInput | undefined = editingExpense
    ? {
        type: editingExpense.type,
        amount: editingExpense.amount,
        description: editingExpense.description,
        categoryId: editingExpense.categoryId,
        date: editingExpense.date,
        periodId: editingExpense.periodId,
        savedExtraAmount: editingExpense.savedExtraAmount,
        linkedExpenseId: editingExpense.linkedExpenseId,
        isFictitious: editingExpense.isFictitious,
        subcategory: editingExpense.subcategory,
        nature: editingExpense.nature,
        isRecurring: editingExpense.isRecurring,
        tags: editingExpense.tags,
        installmentGroupId: editingExpense.installmentGroupId,
        installmentNumber: editingExpense.installmentNumber,
        installmentTotal: editingExpense.installmentTotal,
      }
    : initialPreset
    ? {
        type: initialPreset.type ?? 'real',
        amount: initialPreset.amount ?? 0,
        description: initialPreset.description ?? '',
        categoryId: initialPreset.categoryId ?? 'food',
        date: initialPreset.date ?? defaultDate ?? new Date().toISOString().split('T')[0]!,
        periodId: initialPreset.periodId ?? defaultPeriodId ?? null,
        isFictitious: initialPreset.isFictitious,
        subcategory: initialPreset.subcategory,
        nature: initialPreset.nature,
      }
    : defaultDate || defaultPeriodId
    ? {
        type: 'real',
        amount: 0,
        description: '',
        categoryId: 'food',
        date: defaultDate || new Date().toISOString().split('T')[0]!,
        periodId: defaultPeriodId ?? null,
      }
    : undefined;

  const sheetTitle = editingExpense
    ? STRINGS.FORM_TITLE_EDIT
    : initialPreset?.isFictitious
    ? '🎭 Nueva Máscara Ficticia'
    : initialPreset?.categoryId === 'vices'
    ? '🔥 Nuevo Gasto en Vicios'
    : STRINGS.FORM_TITLE_ADD;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
    >
      <ExpenseForm
        initialValues={initialValues}
        isEditing={Boolean(editingExpense)}
        onSubmit={handleFormSubmit}
        onCancel={onClose}
      />
    </BottomSheet>
  );
}

