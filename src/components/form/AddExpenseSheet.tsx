import { BottomSheet } from '../ui/BottomSheet';
import { ExpenseForm } from './ExpenseForm';
import { Expense, ExpenseInput } from '../../store/types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useToastStore } from '../../store/useToastStore';
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

  const handleFormSubmit = (data: ExpenseInput) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
      showToast(STRINGS.TOAST_EXPENSE_UPDATED, 'info');
    } else {
      const expenseData: ExpenseInput = {
        ...data,
        periodId: data.periodId ?? defaultPeriodId ?? null,
      };
      addExpense(expenseData);
      if (data.isFictitious) {
        showToast('🎭 Gasto ficticio registrado (máscara para padres).', 'success');
      } else if (data.savedExtraAmount && data.savedExtraAmount > 0) {
        showToast(STRINGS.TOAST_EXPENSE_ADDED_WITH_SAVINGS, 'success');
      } else if (data.type === 'delayed') {
        showToast(STRINGS.TOAST_EXPENSE_ADDED_DELAYED, 'success');
      } else {
        showToast(STRINGS.TOAST_EXPENSE_ADDED_REAL, 'success');
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

