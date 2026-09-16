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
}

export function AddExpenseSheet({
  isOpen,
  onClose,
  editingExpense,
  defaultDate,
}: AddExpenseSheetProps) {
  const { addExpense, updateExpense } = useExpenseStore();
  const { showToast } = useToastStore();

  const handleFormSubmit = (data: ExpenseInput) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
      showToast(STRINGS.TOAST_EXPENSE_UPDATED, 'info');
    } else {
      addExpense(data);
      if (data.type === 'delayed') {
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
      }
    : defaultDate
    ? {
        type: 'delayed',
        amount: 0,
        description: '',
        categoryId: 'food',
        date: defaultDate,
      }
    : undefined;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? STRINGS.FORM_TITLE_EDIT : STRINGS.FORM_TITLE_ADD}
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

