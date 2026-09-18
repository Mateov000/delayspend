export type ExpenseType = 'real' | 'delayed' | 'income';

export type ExpenseNature = 'daily' | 'fixed' | 'eventual' | 'house';

export type BudgetPeriodType = 'cycle' | 'monthly' | 'weekly' | 'custom';

export type BuiltInCategoryId =
  | 'food'
  | 'supermarket'
  | 'transport'
  | 'leisure'
  | 'clothing'
  | 'tech'
  | 'subscriptions'
  | 'health'
  | 'aesthetics'
  | 'education'
  | 'vices'
  | 'other';

export type CategoryId = BuiltInCategoryId | (string & {});

export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // Nombre del ícono en lucide-react
  color: string; // Clases Tailwind para bg y texto
  badgeBg: string;
  textColor: string;
  isCustom?: boolean;
}

export interface Expense {
  id: string; // UUID v4 (coincidente con PostgreSQL UUID)
  type: ExpenseType; // 'real': gasto | 'delayed': compra postergada | 'income': ingreso extra
  amount: number; // Monto mayor a 0, redondeado a 2 decimales
  description: string; // Concepto o justificación
  categoryId: CategoryId; // Categoría normalizada
  date: string; // Formato ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 de la transferencia (null si no aplica o pendiente)
  createdAt: string; // ISO 8601 de creación en el dispositivo
  updatedAt: string; // ISO 8601 de última edición
  periodId?: string | null; // ID opcional del período al que pertenece
  savedExtraAmount?: number; // Monto extra ahorrado por optar por una alternativa más barata
  linkedExpenseId?: string | null; // Legacy: ID del gasto real asociado — ignorado en sync
  tags?: string[]; // Etiquetas libres para agrupar por evento/contexto
  installmentGroupId?: string | null; // UUID compartido por todas las cuotas del mismo grupo
  installmentNumber?: number | null; // Número de cuota (1, 2, 3...)
  installmentTotal?: number | null; // Total de cuotas del grupo
  isRecurring?: boolean; // Legacy / compatibilidad
  nature?: ExpenseNature; // 'daily': cotidiano | 'fixed': fijo | 'eventual': esporádico | 'house': para la casa
  subcategory?: string; // Subcategoría opcional (ej: Puchos para categoría Vicios)
  isFictitious?: boolean; // Gasto ficticio (máscara para padres, no cuenta en métricas personales)
}

export interface Period {
  id: string; // UUID v4
  name: string; // ej: "Período 1", "Ciclo Inicial", "Septiembre 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD (null si es el período actualmente activo/abierto)
  initialIncome: number; // Monto de dinero ingresado / presupuesto asignado al período
  cutoffExpenseId?: string | null; // ID opcional del gasto a partir del cual se inició el ciclo
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
  totalReal: number;           // Suma de gastos reales en el período
  totalDelayed: number;        // Suma de gastos delayeados en el período (delayed + savedExtraAmount)
  pendingTransfer: number;     // Delayeados sin transferir (transferredAt === null)
  totalTransferred: number;    // Delayeados ya transferidos (transferredAt !== null)
  totalAccounted: number;      // Total a rendir (real + delayed)
  delayRatePercentage: number; // (totalDelayed / totalAccounted) * 100
  initialIncome: number;       // Ingreso total efectivo (base + extras)
  baseIncome: number;          // Ingreso base inicial del período
  extraIncome: number;         // Suma de ingresos extras registrados en el período
  remainingBalance: number;    // initialIncome - totalAccounted (saldo disponible restando real y delay)
  freeBalance: number;         // initialIncome - totalAccounted
}

export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  description: string;
  categoryId: CategoryId;
  date: string;
  periodId?: string | null;
  savedExtraAmount?: number | null;
  linkedExpenseId?: string | null;
  tags?: string[];
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  isRecurring?: boolean;
  nature?: ExpenseNature;
  subcategory?: string;
  isFictitious?: boolean;
}
