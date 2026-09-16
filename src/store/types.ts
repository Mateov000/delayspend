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
  periodId?: string | null; // ID opcional del período al que pertenece
}

export interface Period {
  id: string; // UUID v4
  name: string; // ej: "Período 1", "Ciclo Inicial", "Septiembre 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD (null si es el período actualmente activo/abierto)
  initialIncome: number; // Monto de dinero ingresado / presupuesto asignado al período
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string | null; // Soft-delete para sincronización
}

export type PeriodFilterType = 'current_month' | 'previous_month' | 'all' | 'custom_period';

export interface PeriodFilterState {
  type: PeriodFilterType;
  periodId?: string;
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
  initialIncome: number;    // Ingreso asignado al período (ej: $50.000)
  remainingBalance: number; // initialIncome - totalReal (plata que queda disponible del ingreso)
  freeBalance: number;      // initialIncome - totalReal - pendingTransfer (plata libre tras apartar el ahorro)
}

export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  description: string;
  categoryId: CategoryId;
  date: string;
  periodId?: string | null;
}
