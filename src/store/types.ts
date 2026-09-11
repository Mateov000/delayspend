export type ExpenseType = 'real' | 'delayed';

export type CategoryId =
  | 'food'
  | 'supermarket'
  | 'transport'
  | 'leisure'
  | 'clothing'
  | 'tech'
  | 'subscriptions'
  | 'health'
  | 'education'
  | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // Nombre del ícono en lucide-react
  color: string; // Clases Tailwind para bg y texto
  badgeBg: string;
  textColor: string;
}

export interface Expense {
  id: string; // UUID v4 o nanoid (alfanumérico único)
  type: ExpenseType; // 'real': plata gastada | 'delayed': compra postergada
  amount: number; // Monto mayor a 0, redondeado a 2 decimales
  description: string; // Concepto o justificación de la compra
  categoryId: CategoryId; // Categoría normalizada
  date: string; // Formato ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 de la transferencia (null si no aplica o pendiente)
  createdAt: string; // ISO 8601 de creación en el dispositivo
  updatedAt: string; // ISO 8601 de última edición
}

export type PeriodFilterType = 'current_month' | 'previous_month' | 'all';

export interface PeriodFilterState {
  type: PeriodFilterType;
  customMonth?: number; // 0-11
  customYear?: number;
}

export interface FinancialMetrics {
  totalReal: number;        // Suma de gastos reales en el período
  totalDelayed: number;     // Suma de gastos delayeados en el período
  pendingTransfer: number;  // Delayeados sin transferir (transferredAt === null)
  totalTransferred: number; // Delayeados ya transferidos (transferredAt !== null)
  totalAccounted: number;   // Total a rendir (real + delayed)
  delayRatePercentage: number; // (totalDelayed / totalAccounted) * 100
}

export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  description: string;
  categoryId: CategoryId;
  date: string;
}

