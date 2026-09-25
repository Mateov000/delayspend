# DelaySpend — Diseño Técnico y Especificación de Dominio
# DelaySpend — Especificación Técnica de Diseño y Dominio

**Documento:** `openspec/design.md`  
**Versión:** 1.0.0 · **Estado:** Aprobado para construcción  
**Versión:** 1.1.0 · **Estado:** Implementado en Producción  
**Metodología:** OpenSpec / ChangeSpec  
> **Documento:** `openspec/design.md`  
> **Versión:** 1.5.0 · **Estado:** Especificación Activa y Validada en Producción  
> **Versión:** 1.6.0 · **Estado:** Especificación Activa y Validada en Producción  
> **Metodología:** Spec-Driven (OpenSpec / ChangeSpec)

---

## 1. 📐 Modelo de Datos y Contrato del Store (Zustand)
## 1. 📐 Modelo de Datos, Esquema Dual y Contratos de Store
## 1. 📐 Modelo de Dominio y Contratos TypeScript (`src/store/types.ts`)

Todo el estado financiero se gestiona mediante un único store de Zustand (`useExpenseStore`), tipado de forma estricta y persistido automáticamente en `localStorage` con la clave `delayspend_storage_v1`.
El sistema opera bajo un paradigma **Local-First con Sincronización en la Nube**. La capa de almacenamiento está dividida en dos niveles:
1. **Capa Local (Caché y Buffer Offline de 0ms)**: Gestionada por Zustand con el middleware `persist` en `localStorage` (clave `delayspend_storage_v1`). Garantiza latencia cero y total disponibilidad offline.
2. **Capa Cloud (Fuente de Verdad Persistente)**: Base de datos relacional PostgreSQL en Supabase (`sa-east-1`, São Paulo), protegida con Row Level Security (RLS) y sincronizada en tiempo real mediante WebSockets.
El sistema DelaySpend modela las finanzas personales desde una perspectiva de economía conductual, dividiendo los movimientos según su propósito real, su impacto en el autocontrol y su horizonte temporal.
El sistema DelaySpend modela las finanzas personales desde una perspectiva de economía conductual, dividiendo los movimientos según su propósito real, su impacto en el autocontrol, su naturaleza operativa y los niveles de privacidad requeridos.

### 1.1 Tipos de Dominio (`src/store/types.ts`)
---
### 1.1 Tipos Primitivos y Enums

### 1.1 Tipos de Dominio TypeScript (`src/store/types.ts`)

```typescript
export type ExpenseType = 'real' | 'delayed';
/** Tipo de movimiento financiero */
export type ExpenseType = 
  | 'real'      // Dinero efectivamente desembolsado
  | 'delayed'   // Compra impulsiva postergada (ahorro en formación)
  | 'income';   // Dinero extra ingresado al período
  | 'delayed'   // Compra impulsiva postergada (ahorro protegido en formación)
  | 'income';   // Dinero extra ingresado al ciclo actual

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
/** Naturaleza del gasto para aislar distorsiones en los promedios diarios */
export type ExpenseNature = 
  | 'daily'     // Cotidiano / Corriente: café, almuerzo, salidas, kiosco
  | 'fixed'     // Fijo / Recurrente: gimnasio, alquiler, internet, abonos
  | 'eventual'  // Esporádico / Eventual: corte de pelo, ropa de abrigo, dentista
  | 'house';    // Para la casa / Familia: verdulería o compras para el hogar
  | 'house';    // Para la casa / Familia: compras de supermercado/verdulería familiar

/** Horizontes temporales para metas de gasto */
export type BudgetPeriodType = 
  | 'cycle'     // Atado al ciclo activo de financiamiento
  | 'monthly'   // Mes calendario (día 1 al último día del mes)
  | 'weekly'    // Semana en curso (lunes a domingo)
  | 'custom';   // Ventana móvil personalizada de N días

/** Categorías nativas predefinidas */
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
  | 'vices'     // Rubro sensible de máxima privacidad
  | 'other';

export type CategoryId = BuiltInCategoryId | (string & {});
```

### 1.2 Entidades Principales

```typescript
export interface Category {
  id: CategoryId;
  name: string;
  icon: string; // Nombre del ícono en lucide-react
  color: string; // Clases Tailwind para bg y texto
  badgeBg: string;
  icon: string;         // Nombre del ícono en lucide-react
  color: string;        // Clases de Tailwind CSS para bordes y texto
  badgeBg: string;      // Clase de fondo de insignia
  textColor: string;
  isCustom?: boolean;   // true si fue creada por el usuario
}

export interface Expense {
  id: string; // UUID v4 o nanoid (alfanumérico único)
  id: string; // UUID v4 (coincidente con PostgreSQL UUID)
  type: ExpenseType; // 'real': plata gastada | 'delayed': compra postergada
  amount: number; // Monto mayor a 0, redondeado a 2 decimales
  description: string; // Concepto o justificación de la compra
  categoryId: CategoryId; // Categoría normalizada
  date: string; // Formato ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 de la transferencia (null si no aplica o pendiente)
  createdAt: string; // ISO 8601 de creación en el dispositivo
  updatedAt: string; // ISO 8601 de última edición
  createdAt: string; // ISO 8601 de creación
  updatedAt: string; // ISO 8601 de última edición (clave para LWW)
  id: string;                   // UUID v4 único
  type: ExpenseType;            // 'real' | 'delayed' | 'income'
  amount: number;               // Monto positivo con 2 decimales
  description: string;          // Concepto o justificación de compra
  categoryId: CategoryId;       // Referencia a Category
  date: string;                 // ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 si fue marcado como transferido a ahorro
  transferredAt: string | null; // ISO 8601 si fue transferido a ahorro
  createdAt: string;            // ISO 8601 de creación
  updatedAt: string;            // ISO 8601 de última edición (clave para resolución LWW)
  updatedAt: string;            // ISO 8601 de última edición (clave para LWW)
  periodId?: string | null;     // ID del ciclo al que pertenece
  savedExtraAmount?: number;    // Sobreprecio evitado por elegir opción más barata
  tags?: string[];              // Etiquetas libres
  nature?: ExpenseNature;       // 'daily' | 'fixed' | 'eventual' | 'house'
  installmentGroupId?: string | null; // UUID para cuotas
  installmentGroupId?: string | null; // UUID de agrupación para compras en cuotas
  installmentNumber?: number | null;  // Número de cuota actual
  installmentTotal?: number | null;   // Cantidad total de cuotas
  isRecurring?: boolean;        // Compatibilidad legacy
  subcategory?: string;         // Subcategoría dinámica (ej: 'Puchos' en Vicios)
  isFictitious?: boolean;       // Gasto ficticio (máscara contable para rendición a padres)
  deletedAt?: string | null;    // Soft-delete para sincronización
}

export type PeriodFilterType = 'current_month' | 'previous_month' | 'all';

export interface PeriodFilterState {
  type: PeriodFilterType;
  customMonth?: number; // 0-11
  customYear?: number;
export interface Period {
  id: string;                   // UUID v4 único
  name: string;                 // Ej: "Período 1", "Quincena Septiembre"
  startDate: string;            // ISO 'YYYY-MM-DD'
  endDate: string | null;       // ISO 'YYYY-MM-DD' (null si es el ciclo en curso)
  initialIncome: number;        // Dinero transferido asignado al inicio
  cutoffExpenseId?: string | null; // ID del gasto a partir del cual se hizo el corte
  createdAt: string;            // ISO 8601 de creación
  updatedAt?: string;           // ISO 8601 de actualización
  deletedAt?: string | null;    // Soft-delete para sincronización
}

export type PeriodFilterType = 'current_month' | 'previous_month' | 'all';

export interface PeriodFilterState {
  type: PeriodFilterType;
  customMonth?: number; // 0-11
  customYear?: number;
}
```

### 1.3 Contratos de Métricas y Exportación
### 1.3 Contratos de Métricas, Presupuestos y Exportación

```typescript
export interface FinancialMetrics {
  totalReal: number;        // Suma de gastos reales en el período
  totalDelayed: number;     // Suma de gastos delayeados en el período
  pendingTransfer: number;  // Delayeados sin transferir (transferredAt === null)
  totalTransferred: number; // Delayeados ya transferidos (transferredAt !== null)
  totalAccounted: number;   // Total a rendir (real + delayed)
  delayRatePercentage: number; // (totalDelayed / totalAccounted) * 100
  totalReal: number;            // Suma de gastos reales
  totalDelayed: number;         // Suma de compras postergadas
  totalReal: number;            // Suma de gastos reales en el período (excluye ficticios)
  totalDelayed: number;         // Suma de compras postergadas en el período
  pendingTransfer: number;      // Postergados aún no transferidos a caja de ahorro
  totalTransferred: number;     // Postergados ya consolidados en caja de ahorro
  totalAccounted: number;       // Total presupuestario rendido (real + delayed)
  delayRatePercentage: number;  // Porcentaje de ahorro sobre el presupuesto
  initialIncome: number;        // Presupuesto asignado al período
  remainingBalance: number;     // initialIncome - totalReal (saldo libre)
}

export interface HistoricalSavings {
  totalSavings: number;         // Ahorro acumulado total en períodos cerrados: delaySpendSavings + incomeLeftoverSavings
  delaySpendSavings: number;    // Ahorro total por postergaciones (compras evitadas + sobreprecios evitados)
  delaySpendDirect: number;     // Desglose: compras no consumadas directamente (gastos postergados)
  delaySpendCheaper: number;    // Desglose: ahorro por versión más barata (sobreprecio evitado)
  incomeLeftoverSavings: number;// Sobrante neto de ingresos en períodos cerrados (ingresos efectivos - gastos reales)
  totalSavings: number;         // Ahorro total acumulado en períodos cerrados
  delaySpendSavings: number;    // Ahorro total por postergaciones (evitados + sobreprecios)
  delaySpendDirect: number;     // Desglose: compras postergadas no consumadas
  delaySpendCheaper: number;    // Desglose: compras por opción más barata
  incomeLeftoverSavings: number;// Sobrante neto de ingresos en períodos cerrados
  closedPeriodsCount: number;   // Cantidad de períodos cerrados auditados
}

export interface ParentExportConfig {
  showCategory?: boolean;       // Incluir o no la categoría en cada ítem
  showNature?: boolean;         // Incluir o no rótulos de naturaleza en los gastos
  includedNatures?: Record<ExpenseNature, boolean>; // Qué rótulos de naturaleza mostrar ([🛒 Cotidiano], [🔄 Fijo], etc.). Todos los gastos se exportan siempre.
  showNature?: boolean;         // Interruptor maestro: mostrar u ocultar etiquetas de naturaleza
  showNatureTags?: Record<ExpenseNature, boolean>; // De qué naturalezas mostrar etiqueta. Aunque se desmarque, el gasto aparece igual.
  includedNatures?: Record<ExpenseNature, boolean>; // Qué naturalezas de gasto se incluyen en el reporte. Si se desmarca, se excluye el gasto y su monto.
  showNature?: boolean;         // Interruptor maestro: mostrar etiquetas de naturaleza
  showNatureTags?: Record<ExpenseNature, boolean>; // De qué naturalezas mostrar etiqueta
  includedNatures?: Record<ExpenseNature, boolean>; // Qué naturalezas incluir en el total
  summaryMode?: 'full' | 'total_only'; // Detalle completo vs solo total a rendir
}
```

### 1.2 Interfaz del Store Financiero (`src/store/useExpenseStore.ts`)
### 1.4 Reglas de Privacidad Estricta: Categoría Vicios y Gastos Ficticios

1. **Categoría Nativa `vices`:**
   - Identificador `vices`, ícono `Flame` (llama), color ámbar (`bg-amber-100 text-amber-900 border-amber-300`).
   - Soporta subcategorías dinámicas creadas por el usuario (default: `['Puchos']`), almacenadas en `useCategoryStore.subcategoriesByCategory['vices']`.
2. **Garantía de Exclusión Total (Regla de Oro Parental):**
   - En cualquier exportación orientada a padres (`unified: true`), la condición `e.categoryId === 'vices'` excluye **incondicionalmente** el gasto del texto de WhatsApp y del CSV.
   - El monto de los vicios jamás aparece ni suma al total a rendir familiar. No hay posibilidad de filtración accidental.
3. **Gastos Ficticios (`isFictitious: true`):**
   - Movimientos contables creados para compensar el dinero que se fue en vicios o gastos personales que el usuario no desea revelar.
   - **Aislamiento personal total:** Se excluyen de todas las métricas personales (`totalReal`, promedio diario corriente, metas presupuestarias por rubro o globales, y ahorro acumulado histórico).
   - **Comportamiento en rendición familiar:** Se incluyen en el reporte para padres como gastos comunes (con su categoría y naturaleza nominales, sin ningún rótulo de ficción), sumando al total rendido para que el balance contable cuadre con el dinero transferido.
4. **Balance Ficticio - Vicios:**
   $$\text{Balance} = \sum_{e \in \text{period}, e.\text{isFictitious}} e.\text{amount} - \sum_{e \in \text{period}, e.\text{categoryId}=\text{'vices'}} e.\text{amount}$$
   - Monitoreado en tiempo real en el Dashboard mediante el componente `ViceBalanceCard`.

### 1.5 Subcategorías Universales y Metas de Gasto por Subcategoría

1. **Subcategorías Universales (`useCategoryStore`):**
   - El catálogo gestiona `subcategoriesByCategory: Record<string, string[]>`.
   - Cualquier categoría (nativa o creada por el usuario) admite la creación de subcategorías ilimitadas (ej: *Comida* -> "Delivery", "Supermercado", "Almuerzo trabajo"; *Transporte* -> "Uber", "Colectivo", "Nafta"; *Vicios* -> "Puchos", "Alcohol", etc.).
   - Persistencia local bajo la clave `delayspend_categories_v2`.
   - Se crean tanto desde **Ajustes** como al vuelo desde la hoja de carga rápida de gastos (`ExpenseForm`).
2. **Metas Presupuestarias por Subcategoría (`useBudgetStore`):**
   - Se modelan con la interfaz `SubcategoryBudget`:
     ```typescript
     export interface SubcategoryBudget {
       id: string;
       categoryId: CategoryId;
       subcategory: string;
       amount: number;         // Meta por ciclo
       weeklyAmount?: number;  // Meta semanal
       monthlyAmount?: number; // Meta mensual
       customAmount?: number;  // Meta personalizada
       createdAt: string;
       updatedAt: string;
     }
     ```
   - Persistencia local bajo la clave `delayspend_budgets_v2`.
   - Clave única de runtime: `${categoryId}:::${subcategory.toLowerCase()}`.
   - **Cálculo en `src/utils/budgetMetrics.ts`:**
     - `getSpentForSubcategory(expenses, categoryId, subcategory)`: suma gastos reales que coincidan con categoría y subcategoría (case-insensitive y trim), excluyendo rigurosamente `isFictitious`.
     - `calculateSubcategorySpending(expenses, subcategoryBudgets)`: evalúa porcentajes y saldos restantes para el ciclo.
     - `calculateSubcategoryPeriodicSpending(...)`: evalúa gastos dentro de rangos semanales, mensuales o móviles de N días y calcula la asignación diaria recomendada (`dailyAllowance`).
   - **Visualización Reactiva en `BudgetGoalsCard`:** Renderiza `SubcategoryGoalsSection` en las 4 pestañas de periodicidad con barras de progreso, badges de advertencia/exceso y ritmo diario.

---

### 1.2 Esquema Relacional PostgreSQL en Supabase (`public.expenses`)
## 2. 🏗️ Arquitectura del Sistema y Stores de Estado (Zustand)

La aplicación implementa una arquitectura **Local-First Híbrida**:
1. **Cero latencia (0ms):** Toda lectura o mutación se resuelve inmediatamente en memoria mediante stores de Zustand y se persiste en `localStorage`.
2. **Buffer reactivo offline:** La aplicación opera de forma autónoma sin red. Si la conexión cae, las operaciones quedan en cola.
3. **Replicación continua en segundo plano:** Un bus de eventos desacoplado (`registerSyncListener`) despacha las mutaciones hacia el backend PostgreSQL en Supabase.
4. **Resolución de Conflictos Last-Write-Wins (LWW):** Se utiliza la estampa `updatedAt` para resolver versiones divergentes entre clientes.

```
┌─────────────────────────────────────────────────────────────┐
│                      CAPA DE VISTA                          │
│   Dashboard · Historial · Analíticas · Ajustes · Export     │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────┐┌──────────────────────────────┐
│       STORES ZUSTAND        ││       UTILIDADES PURAS       │
│  • useExpenseStore          ││  • metrics.ts (fórmulas)     │
│  • usePeriodStore           ││  • budgetMetrics.ts          │
│  • useBudgetStore           ││  • historicalSavings.ts      │
│  • useCategoryStore         ││  • export.ts (WhatsApp/CSV)  │
│  • useFilterStore           ││  • format.ts (moneda es-AR)  │
│  • useAuthStore             ││  • date.ts (rangos)          │
│  • useToastStore            │└──────────────────────────────┘
└──────────────┬──────────────┘
               │ (Listeners desacoplados)
               ▼
┌─────────────────────────────┐
│    SYNC ENGINE (useSync)    │
│  • Cola offline persistente │
│  • Realtime WebSockets      │
│  • Resolución Last-Write-Win│
└──────────────┬──────────────┘
               │ HTTPS / WSS
               ▼
┌─────────────────────────────┐
│    SUPABASE (PostgreSQL)    │
│  • Auth JWT + RLS           │
│  • Tablas: expenses, periods│
│  • Trigger auto-confirmación│
└─────────────────────────────┘
```

### Stores del Sistema:
- **`useExpenseStore`:** Colección de gastos, CRUD inmutable, marca de transferencia y hooks de sync.
- **`usePeriodStore`:** Administración de ciclos de vida de períodos, corte por fecha, corte por gasto específico y reversión (*undo*).
### 2.1 Stores del Sistema:
- **`useExpenseStore`:** Colección de gastos, CRUD inmutable, marca de transferencia, soporte de subcategorías y gastos ficticios, y hooks de sync.
- **`usePeriodStore`:** Administración de ciclos de vida de períodos, corte por fecha, corte por gasto específico (`cutoffExpenseId`) y reversión (*undo*).
- **`useBudgetStore`:** Metas multitemporales (`cycle`, `monthly`, `weekly`, `custom`), límites globales y presupuestos por rubro.
- **`useCategoryStore`:** Catálogo de categorías, creación de rubros personalizados y lista de enmascaramiento parental (`parentMaskedCategoryIds`).
- **`useCategoryStore`:** Catálogo de categorías, subcategorías dinámicas de vicios (`viceSubcategories`), creación de rubros personalizados y lista de enmascaramiento parental (`parentMaskedCategoryIds`).
- **`useFilterStore`:** Selección del período o filtro temporal activo en la interfaz.
- **`useToastStore`:** Cola de mensajes efímeros con auto-remoción a los 3000ms.
- **`useAuthStore`:** Sesión activa JWT de Supabase Auth.
- **`useSyncStore`:** Monitor de sincronización bidireccional, estado de conexión y suscripción Realtime.

---

## 3. 🗄️ Esquema Relacional de Base de Datos (PostgreSQL / Supabase)

### 3.1 Tabla `public.expenses`

```sql
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('real', 'delayed')),
  type text not null check (type in ('real', 'delayed', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft delete para propagar borrados a otros dispositivos
  deleted_at timestamptz,
  period_id uuid references public.periods(id) on delete set null,
  saved_extra_amount numeric(12, 2) check (saved_extra_amount >= 0),
  nature text not null default 'daily' check (nature in ('daily', 'fixed', 'eventual', 'house')),
  tags text[],
  installment_group_id uuid,
  installment_number integer,
  installment_total integer
  installment_total integer,
  is_fictitious boolean not null default false,
  subcategory text
);

-- Índices de alto rendimiento
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_expenses_user_updated on public.expenses(user_id, updated_at desc);
create index if not exists idx_expenses_period on public.expenses(period_id);
create index if not exists idx_expenses_fictitious on public.expenses(user_id, is_fictitious);

-- Políticas RLS
alter table public.expenses enable row level security;

create policy "Users can view their own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert their own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update their own expenses" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own expenses" on public.expenses for delete using (auth.uid() = user_id);
create policy "Users manage their own expenses"
create policy "Users can manage their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Replicación en tiempo real
alter publication supabase_realtime add table public.expenses;
```

---
### 3.2 Tabla `public.periods`

### 1.3 Contrato del Store Financiero (`src/store/useExpenseStore.ts`)
```sql
create table if not exists public.periods (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date,
  initial_income numeric(12, 2) not null default 0 check (initial_income >= 0),
  cutoff_expense_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

```typescript
export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  description: string;
  categoryId: CategoryId;
  date: string;
}
create index if not exists idx_periods_user on public.periods(user_id, start_date desc);

export interface ExpenseState {
  expenses: Expense[];
  
  // Acciones CRUD
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: Partial<ExpenseInput>) => void;
  deleteExpense: (id: string) => void;
  
  // Acciones de Ahorro y Rendición (Métrica estrella)
  markAllPendingAsTransferred: () => void;
  toggleTransferred: (id: string) => void;
  
  // Mantenimiento
  // Mantenimiento y Migración
  resetAllData: () => void;
  importExpenses: (expenses: Expense[]) => void;
}
alter table public.periods enable row level security;

// Hook desacoplado de sincronización reactiva
type SyncListener = (action: 'push' | 'delete', item: Expense | string) => void;
export function registerSyncListener(listener: SyncListener): void;
```
create policy "Users manage their own periods"
create policy "Users can manage their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

### 1.3 Reglas de Negocio del Store
---

1. **Inmutabilidad estricta**: Ninguna acción muta el array `expenses` in-place; siempre se retornan nuevas copias vía spread o `filter`/`map`.
2. **Validación de Monto**: `amount` debe ser un número finito estrictamente mayor a `0`.
3. **Mecánica de `transferredAt`**:
   - Para gastos reales (`type === 'real'`), `transferredAt` siempre debe ser `null`.
   - Para compras delayeadas (`type === 'delayed'`), nace con `transferredAt: null`.
   - Al ejecutar `markAllPendingAsTransferred()`, todos los gastos con `type === 'delayed' && transferredAt === null` actualizan su `transferredAt` con el timestamp `new Date().toISOString()`.
   - `toggleTransferred(id)` permite conmutar el estado si el usuario se equivocó o transfirió manualmente solo ese ítem.
4. **Persistencia y Sanitización**: El middleware `persist` de Zustand serializa el array `expenses`. Al rehidratar, si alguna fecha o campo numérico viene corrupto, se descarta o repara sin romper la app.
### 1.4 Contrato del Store de Autenticación (`src/store/useAuthStore.ts`)

```typescript
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => () => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
alter publication supabase_realtime add table public.periods;
```

---
### 3.3 Trigger de Auto-Confirmación de Cuentas (Bypass SMTP)
### 3.3 Historial de Migraciones SQL en Supabase
1. `20260914000001_initial_schema.sql`: Estructura inicial de `expenses`, RLS y suscripción Realtime.
2. `20260914000002_auto_confirm_users.sql`: Trigger `auto_confirm_user` para bypass SMTP en registro.
3. `20260916000003_add_periods_and_features.sql`: Tabla `periods`, columnas `period_id`, `cutoff_expense_id`, `saved_extra_amount`, `nature`, `installment_*`.
4. `20260918000004_add_fictitious_and_subcategory.sql`: Columnas `is_fictitious` y `subcategory` en `expenses` con índice optimizado.

### 1.5 Contrato del Store de Sincronización (`src/store/useSyncStore.ts`)

```typescript
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'guest';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
  setStatus: (status: SyncStatus) => void;
  initializeSync: (userId: string | null) => () => void;
  pushExpense: (expense: Expense, userId: string) => Promise<void>;
  deleteRemoteExpense: (id: string, userId: string) => Promise<void>;
  pushPeriod: (period: Period, userId: string) => Promise<void>;
  deleteRemotePeriod: (id: string, userId: string) => Promise<void>;
  syncAllWithCloud: (userId: string) => Promise<void>;
}
```

---

### 1.6 Reglas de Negocio, Concurrencia y Sincronización
## 4. 🏛️ Arquitectura de Componentes de Interfaz

1. **Inmutabilidad y 0ms Local-First**: Las mutaciones actualizan de inmediato el estado de Zustand y se persisten en `localStorage`. Nunca se espera una respuesta de red para actualizar la UI.
2. **Push Asíncrono Desacoplado**: Al ocurrir una mutación local, el store dispara un evento mediante `syncListener`. Si el usuario tiene sesión activa y conexión, `useSyncStore` realiza un `upsert` en Supabase en segundo plano.
3. **Resolución de Conflictos Last-Write-Wins (LWW)**: Tanto en el merge inicial como en eventos en tiempo real, si existen dos versiones de un mismo registro (`id`), prevalece aquella con el timestamp `updatedAt` más reciente.
4. **Propagación de Borrados con Soft-Delete**: Al eliminar un registro en la nube, se estampa `deleted_at = now()` para que otros dispositivos conectados sepan que deben eliminarlo de su caché local antes de la purga física.
5. **Merge al Iniciar Sesión**: Si un usuario tiene gastos cargados localmente de forma anónima y decide crear o iniciar sesión en su cuenta, `syncAllWithCloud` sube automáticamente los gastos locales a la base de datos sin pérdida de información.
6. **Resiliencia de Red y Prevención de Cuelgues en iOS / Safari:**
   - **`withTimeout` Estricto:** Toda petición de red hacia Supabase REST (`select`, `upsert`, `update`) se ejecuta bajo un límite de tiempo estricto (8 segundos para sync general, 6 segundos para push/delete). Si WebKit mantiene sockets TCP "half-open" o congelados, la promesa se aborta y se captura limpiamente sin colgar la app.
   - **Mutex y Deduplicación Concurrente:** Un semáforo (`activeSyncPromise`) garantiza que si `online`, `visibilitychange` y `focus` se disparan simultáneamente (típico al desbloquear un iPhone), solo se procese una sincronización unificada.
   - **Debounce de Reconexión:** Los eventos de reconexión se consolidan mediante un debouncer de 300-400ms.
   - **Watchdog Timer de Seguridad (10 segundos):** Si la UI entra en `status: 'syncing'`, un temporizador de 10s fuerza el retorno a un estado seguro (`'synced'` o `'offline'`), eliminando definitivamente el spinner infinito en dispositivos móviles.
   - **Reconexión de Realtime WebSockets:** Al detectar el retorno de conectividad o foco en la ventana, se invoca `supabase.realtime.connect()` para reanudar el transporte WebSocket suspendido por iOS.
   - **Desacople de `navigator.onLine`:** En WebKit/iOS Safari, `navigator.onLine` reporta falsos negativos recurrentes tras desbloquear la pantalla. La sincronización intenta la conexión y delega la detección en el resultado real de red con timeout de 8 segundos.
   - **Fallback Adaptativo de Esquema (Schema Fallback):** Si la base de datos remota de Supabase aún no cuenta con las columnas `is_fictitious` o `subcategory` (PostgREST error 400 / SQLSTATE 42703), el sincronizador detecta la ausencia de columnas, sanea el payload excluyéndolas temporalmente y reintenta el `upsert` de inmediato, garantizando sincronización exitosa sin interrumpir al usuario.
7. **Aislamiento Total de Gastos Ficticios (`isFictitious: true`):**
   - No computan en `totalReal`, `totalDelayed`, `netDailyAllowance`, promedios ni proyecciones de fin de mes.
   - No computan en el gráfico comparativo de barras de ciclos (`PeriodBarChart`).
   - No computan en los subtotales diarios de la vista del historial (`groupExpensesByDate`).
   - Cero presencia en analíticas personales: su cómputo es exclusivamente para la tarjeta de balance de vicios (`ViceBalanceCard`) y para la rendición de cuentas a padres (`ExportPanel`).

---

## 2. 🏛️ Arquitectura de Componentes

La aplicación está diseñada para operar como una Single Page Application (SPA) Mobile-First contenida en un marco responsivo centrado (ancho máximo `max-w-md` en pantallas grandes).
La aplicación opera como una Single Page Application (SPA) Mobile-First centrada con ancho máximo `max-w-md` en pantallas grandes.

### 2.1 Árbol de Componentes
### 4.1 Árbol de Componentes

```
App
├── Layout
│   ├── Header
│   │   ├── SyncBadge (🟢 Sincronizado | 🔄 Sincronizando | 🟡 Offline | ☁️ Sincronizar)
│   │   └── ExportButton
│   ├── PeriodFilter (Píldoras Este mes / Mes anterior / Todo)
│   ├── SummaryCards
│   │   ├── RealExpenseCard (Total Gastado)
│   │   ├── DelayedExpenseCard (Total Guardado)
│   │   └── TransferActionCard (Métrica Estrella + Botón "Ya lo transferí")
│   ├── ExpenseHistory
│   │   ├── EmptyState (si no hay gastos en el período)
│   │   └── ExpenseHistoryGroup (agrupado por fecha: "Hoy", "Ayer", etc.)
│   │       └── ExpenseListItem (ítem con badge, categoría, estado y menú de acciones)
│   ├── Header (SyncBadge, ExportButton, Tabs de navegación)
│   ├── Main Content
│   │   ├── Dashboard
│   │   │   ├── PeriodBanner (Selector de ciclo, corte, deshacer corte)
│   │   │   ├── SummaryCards (Total Gastado, Total Guardado, Saldo Remanente)
│   │   │   ├── TransferActionCard (Métrica estrella + Botón "Ya lo transferí")
│   │   │   ├── ViceBalanceCard (Balance Ficticio-Vicio, accesos rápidos, desglose)
│   │   │   └── ExpenseHistory (Lista agrupada por fecha)
│   │   ├── AnalyticsView
│   │   │   ├── BudgetGoalCard (Metas: ciclo/mes/semana/custom, ritmo real vs proyectado)
│   │   │   ├── HistoricalSavingsCard (Ahorro acumulado períodos cerrados, acordeón de desglose)
│   │   │   ├── NatureSelector (Filtro interactivo: Todas vs Solo corrientes)
│   │   │   └── CategoryDonutChart (Gráfico de distribución por rubro)
│   │   └── SettingsView
│   │       ├── BudgetSettings (Presupuestos, creación de categorías, privacidad)
│   │       └── AccountSettings (Auth, sesión, forzado de sync)
│   └── FloatingActionButton (FAB [+] para abrir carga rápida)
├── AddExpenseSheet (BottomSheet modal para alta y edición)
│   └── ExpenseForm
│       ├── TypeSelector (Toggle Gasto Real vs Compra Delayeada)
│       ├── AmountInput (Display numérico gigante con inputMode decimal)
│       ├── CategorySelector (Grid táctil con íconos)
│       ├── DescriptionInput (Concepto)
│       └── DateInput (Selector de fecha)
├── AuthModal (BottomSheet para login, registro, auto-confirmación y cierre de sesión)
├── ExportPanel (Modal con vista previa para WhatsApp y descarga de CSV)
├── ConfirmDialog (Modal reutilizable para acciones destructivas)
└── Toaster (Contenedor de notificaciones flotantes reactivas)
├── AddExpenseSheet (BottomSheet modal)
│   └── ExpenseForm (Toggle Real/Delayed/Income, Ficticio, Subcategorías, Naturaleza)
├── ExportPanel (Modal con configuración ⚙️, WhatsApp y CSV)
├── ConfirmDialog (Diálogo accesible sin window.confirm)
└── Toaster (Notificaciones flotantes)
```

### 2.2 Especificación y Responsabilidad de Componentes

| Componente | Archivo | Responsabilidad Única |
|---|---|---|
| `Layout` | `src/components/layout/Layout.tsx` | Contenedor principal centrado (`max-w-md mx-auto min-h-screen pb-24 relative bg-slate-50`). Asegura el área segura (safe-area) de dispositivos móviles. |
| `Header` | `src/components/layout/Header.tsx` | Muestra el isotipo y nombre de la app, el tagline conductual breve y el botón de acceso directo a `ExportPanel`. |
| `Header` | `src/components/layout/Header.tsx` | Muestra el isotipo y nombre de la app, el botón de estado de sincronización / autenticación y el acceso a `ExportPanel`. |
| `AuthModal` | `src/components/auth/AuthModal.tsx` | Modal de autenticación conmutador de SignIn/SignUp, visualización de usuario vinculado, forzado manual de sync y cierre de sesión. Sanitiza inputs automáticamente. |
| `PeriodFilter` | `src/components/dashboard/PeriodFilter.tsx` | Selector segmentado tipo píldora (`Este mes`, `Mes anterior`, `Todo el historial`). Controla el filtro activo en `useFilterStore`. |
| `SummaryCards` | `src/components/dashboard/SummaryCards.tsx` | Renderiza el bloque superior con las 3 tarjetas de métricas. Orquesta la sincronización con los cálculos de `utils/metrics.ts`. |
| `TransferActionCard` | `src/components/dashboard/TransferActionCard.tsx` | **Componente Estrella**: Muestra el monto exacto pendiente de transferir a la cuenta de ahorro. Si el monto es > 0, despliega el botón `[ Ya lo transferí ]`. Si es 0, muestra el estado de éxito "Al día con el ahorro 🎉". |
| `ExpenseHistory` | `src/components/history/ExpenseHistory.tsx` | Lista cronológica descendente. Agrupa los gastos filtrados utilizando `utils/date.ts`. |
| `ExpenseHistoryGroup` | `src/components/history/ExpenseHistoryGroup.tsx` | Encabezado de grupo de fecha ("Hoy", "Ayer", o fecha formal) con subtotal neto del día y lista de items. |
| `ExpenseListItem` | `src/components/history/ExpenseListItem.tsx` | Fila interactiva de gasto: ícono de categoría, descripción, badge visual (Gasto vs Delayeado), badge de "Transferido" y menú de acciones (Editar / Eliminar). |
| `FloatingActionButton` | `src/components/form/FloatingActionButton.tsx` | Botón circular fijo (`bottom-6 right-6`), tamaño táctil de 56x56px con elevación, accesible con el pulgar para abrir `AddExpenseSheet`. |
| `AddExpenseSheet` | `src/components/form/AddExpenseSheet.tsx` | BottomSheet modal con backdrop oscurecido y animación de deslizamiento desde el pie de pantalla. Soporta cierre por tap afuera o tecla `Escape`. |
| `ExpenseForm` | `src/components/form/ExpenseForm.tsx` | Formulario de alta/edición. Cuenta con toggle de tipo, input de monto de gran tamaño, selector de categoría por tarjetas táctiles y botón de envío dinámico. |
| `ExportPanel` | `src/components/export/ExportPanel.tsx` | Modal con 2 pestañas: "WhatsApp" (con botón de copia directa) y "Excel / CSV" (con botón de descarga de archivo). Muestra resumen de rendición. |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.tsx` | Modal de confirmación accesible para eliminar gastos o resetear datos. Prohibido el uso de `window.confirm`. |
| `Toaster` | `src/components/ui/Toaster.tsx` | Visualizador de notificaciones toast automáticas con auto-dismiss a los 3 segundos. |
| `TransferActionCard` | `src/components/dashboard/TransferActionCard.tsx` | **Componente Estrella**: Muestra el monto exacto pendiente de transferir a la cuenta de ahorro. Si es > 0 despliega `[ Ya lo transferí ]`; si es 0 muestra estado de éxito. |
| `ExpenseHistory` | `src/components/history/ExpenseHistory.tsx` | Lista cronológica descendente agrupada por fecha. |
| `ExpenseListItem` | `src/components/history/ExpenseListItem.tsx` | Fila interactiva de gasto: ícono, categoría, badges de estado y menú de acciones (Editar / Eliminar). |
| `FloatingActionButton` | `src/components/form/FloatingActionButton.tsx` | Botón circular fijo (`bottom-6 right-6`, 56x56px), accesible con el pulgar para abrir `AddExpenseSheet`. |
| `AddExpenseSheet` | `src/components/form/AddExpenseSheet.tsx` | BottomSheet modal con backdrop oscurecido y animación de deslizamiento. |
| `ExpenseForm` | `src/components/form/ExpenseForm.tsx` | Formulario de alta/edición de gastos con toggle de tipo, input numérico grande y grid de categorías. |
| `ExportPanel` | `src/components/export/ExportPanel.tsx` | Modal con pestañas para WhatsApp (con copiado directo) y CSV para Excel. |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.tsx` | Modal de confirmación accesible para eliminar gastos o resetear datos. Prohibido `window.confirm`. |
| `Toaster` | `src/components/ui/Toaster.tsx` | Notificaciones toast automáticas con auto-dismiss a los 3 segundos. |

---

## 3. 💬 Tabla de Exact Spanish Strings (`src/constants/strings.ts`)
## 5. 💬 Tabla de Textos y Tono de Comunicación (`src/constants/strings.ts`)

Esta tabla es la **ÚNICA fuente de verdad** para todos los textos visibles en la interfaz. La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`). Queda terminantemente prohibido inventar textos inline en los componentes.
Esta tabla es la **ÚNICA fuente de verdad** para todos los textos visibles en la interfaz. La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`).
La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`).
Se centralizan títulos, etiquetas, placeholders y mensajes de confirmación para evitar textos literales sueltos.

```typescript
export const STRINGS = {
  // Marca y Cabecera
  APP_NAME: 'DelaySpend',
  APP_TAGLINE: 'Cada gasto que evitás vale tanto como lo que gastás.',
  EXPORT_BUTTON: 'Rendición / Exportar',

  // Filtros de Período
  FILTER_CURRENT_MONTH: 'Este mes',
  FILTER_PREVIOUS_MONTH: 'Mes anterior',
  FILTER_ALL: 'Todo el historial',

  // Dashboard y Métricas
  METRICS_REAL_TITLE: 'Total Gastado',
  METRICS_REAL_SUBTITLE: 'Plata que salió de tu bolsillo',
  METRICS_DELAYED_TITLE: 'Total Guardado',
  METRICS_DELAYED_SUBTITLE: 'Compras que decidiste evitar',
  METRICS_TRANSFER_TITLE: 'Monto a Transferir',
  METRICS_TRANSFER_SUBTITLE: 'Para mover de NX a tu cuenta de ahorro',
  METRICS_TRANSFER_ACTION: 'Ya lo transferí',
  METRICS_TRANSFER_SUCCESS: '¡Estás al día con tu ahorro! 🚀',
  METRICS_ACCOUNTED_LABEL: 'Rendición Total (Gastado + Ahorrado):',

  // Formulario de Carga
  FORM_TITLE_ADD: 'Nuevo Registro',
  FORM_TITLE_EDIT: 'Editar Registro',
  FORM_TYPE_REAL: 'Gasto Real',
  FORM_TYPE_DELAYED: 'Compra Delayeada',
  FORM_TYPE_REAL_DESC: 'Plata que ya pagaste',
  FORM_TYPE_DELAYED_DESC: 'Ibas a comprarlo y te frenaste',
  FORM_AMOUNT_LABEL: 'Monto en pesos',
  FORM_AMOUNT_PLACEHOLDER: '0',
  FORM_CATEGORY_LABEL: 'Categoría',
  FORM_DESCRIPTION_LABEL: 'Concepto o detalle',
  FORM_DESCRIPTION_PLACEHOLDER: 'Ej: Café al paso, Buzo en rebaja, Delivery...',
  FORM_DATE_LABEL: 'Fecha',
  FORM_SUBMIT_REAL: 'Registrar gasto',
  FORM_SUBMIT_DELAYED: '¡Delayear y guardar!',
  FORM_SUBMIT_EDIT: 'Guardar cambios',
  FORM_CANCEL: 'Cancelar',

  // Historial y Listado
  HISTORY_TITLE: 'Movimientos',
  HISTORY_EMPTY_TITLE: 'No hay movimientos en este período',
  HISTORY_EMPTY_DESC: 'Tocá el botón (+) para registrar tu primer gasto o una compra que hayas delayeado.',
  HISTORY_TODAY: 'Hoy',
  HISTORY_YESTERDAY: 'Ayer',
  HISTORY_BADGE_REAL: 'Gasto',
  HISTORY_BADGE_DELAYED: 'Delayeado',
  HISTORY_BADGE_TRANSFERRED: 'Ahorro transferido',
  HISTORY_ACTION_EDIT: 'Editar',
  HISTORY_ACTION_DELETE: 'Eliminar',
  HISTORY_ACTION_MARK_TRANSFERRED: 'Marcar como transferido',
  HISTORY_ACTION_UNMARK_TRANSFERRED: 'Desmarcar transferencia',

  // Acciones Destructivas y Modales de Confirmación
  CONFIRM_DELETE_TITLE: '¿Eliminar este movimiento?',
  CONFIRM_DELETE_MSG: 'Esta acción no se puede deshacer. Se descontará del historial y de los cálculos.',
  CONFIRM_DELETE_BUTTON: 'Sí, eliminar',
  CONFIRM_DELETE_CANCEL: 'No, conservar',

  CONFIRM_TRANSFER_ALL_TITLE: '¿Confirmás la transferencia?',
  CONFIRM_TRANSFER_ALL_MSG: 'Vamos a marcar todos tus gastos delayeados pendientes como transferidos a tu cuenta de ahorro. El contador volverá a $0.',
  CONFIRM_TRANSFER_ALL_BUTTON: 'Confirmar transferencia',
  CONFIRM_TRANSFER_ALL_CANCEL: 'Todavía no',

  CONFIRM_RESET_TITLE: '¿Borrar todos los datos de la app?',
  CONFIRM_RESET_MSG: 'Se eliminarán definitivamente todos los gastos cargados en este dispositivo. Te recomendamos exportar antes.',
  CONFIRM_RESET_BUTTON: 'Borrar todo',
  CONFIRM_RESET_CANCEL: 'Volver',

  // Panel de Rendición y Exportación
  EXPORT_TITLE: 'Rendición de Cuentas',
  EXPORT_SUBTITLE: 'Generá un resumen claro para mandarle a tus padres o guardar como comprobante.',
  EXPORT_TAB_WHATSAPP: 'Para WhatsApp',
  EXPORT_TAB_CSV: 'Archivo CSV (Excel)',
  EXPORT_WHATSAPP_HINT: 'Copiá el texto y pegalo directamente en el chat. Ya viene formateado con subtotales.',
  EXPORT_WHATSAPP_COPY_BUTTON: 'Copiar reporte para WhatsApp',
  EXPORT_CSV_DOWNLOAD_BUTTON: 'Descargar reporte (.csv)',
  EXPORT_WHATSAPP_HEADER: '📊 *Rendición de Gastos - DelaySpend*',
  EXPORT_WHATSAPP_PERIOD: '🗓 *Período:*',
  EXPORT_WHATSAPP_REAL_SECTION: '💸 *Gastos Reales Realizados:*',
  EXPORT_WHATSAPP_DELAYED_SECTION: '🛡 *Compras Delayeadas (Ahorradas):*',
  EXPORT_WHATSAPP_SUMMARY_SECTION: '📈 *Resumen Financiero:*',
  EXPORT_WHATSAPP_TOTAL_REAL: '• Total gastado efectivamente:',
  EXPORT_WHATSAPP_TOTAL_DELAYED: '• Total protegido/ahorrado:',
  EXPORT_WHATSAPP_PENDING_TRANSFER: '• Monto a transferir a caja de ahorro:',
  EXPORT_WHATSAPP_TOTAL_BUDGET: '• Total presupuestario rendido:',
  EXPORT_WHATSAPP_FOOTER: 'Generado con DelaySpend 🚀',
  EXPORT_UNIFY_LABEL: 'Rendición unificada (para rendir a padres)',
  EXPORT_UNIFY_DESC: 'Muestra todos los movimientos como gastos directos sin distinguir delayeados, justificando el monto total.',
  EXPORT_WHATSAPP_UNIFIED_SECTION: '💸 *Detalle de Gastos del Período:*',
  EXPORT_WHATSAPP_UNIFIED_TOTAL: '• Total a rendir / reponer:',
  EXPORT_CSV_UNIFIED_DESC: 'Este archivo unifica todas las compras como gastos directos (Fecha, Monto, Categoría, Detalle) sin indicar si fueron postergadas o delayeadas.',

  // Notificaciones Toast
  TOAST_EXPENSE_ADDED_REAL: 'Gasto registrado correctamente.',
  TOAST_EXPENSE_ADDED_DELAYED: '¡Buenísimo! Delayaste este gasto y cuidaste tu plata.',
  TOAST_EXPENSE_UPDATED: 'Movimiento actualizado.',
  TOAST_EXPENSE_DELETED: 'Movimiento eliminado.',
  TOAST_TRANSFERRED_ALL_SUCCESS: '¡Excelente! Moviste el dinero a tu cuenta de ahorro.',
  TOAST_TRANSFER_TOGGLED: 'Estado de transferencia actualizado.',
  TOAST_COPIED_TO_CLIPBOARD: 'Reporte copiado al portapapeles listo para enviar.',
  TOAST_CSV_DOWNLOADED: 'Archivo CSV descargado con éxito.',
  TOAST_ERROR_INVALID_AMOUNT: 'Por favor ingresá un monto válido mayor a 0.',
  TOAST_ERROR_NO_DESCRIPTION: 'Por favor agregá un detalle o concepto.',

  // Sincronización Multi-Dispositivo & Auth
  SYNC_STATUS_SYNCED: 'Sincronizado',
  SYNC_STATUS_SYNCING: 'Sincronizando...',
  SYNC_STATUS_OFFLINE: 'Sin conexión',
  SYNC_STATUS_GUEST: 'Sincronizar',
  AUTH_TITLE_SIGNIN: 'Iniciar Sesión',
  AUTH_TITLE_SIGNUP: 'Crear Cuenta para Sincronizar',
  AUTH_EMAIL_LABEL: 'Correo electrónico',
  AUTH_PASSWORD_LABEL: 'Contraseña (mínimo 6 caracteres)',
  AUTH_BUTTON_SIGNIN: 'Entrar y sincronizar',
  AUTH_BUTTON_SIGNUP: 'Crear cuenta y sincronizar',
  AUTH_BUTTON_LOGOUT: 'Cerrar sesión en este dispositivo',
  AUTH_SUCCESS_LOGIN: '¡Sesión iniciada! Tus gastos se están sincronizando.',
  AUTH_SUCCESS_LOGOUT: 'Cerraste sesión correctamente.',
  AUTH_SWITCH_TO_SIGNUP: '¿No tenés cuenta todavía? Creala en un toque',
  AUTH_SWITCH_TO_SIGNIN: '¿Ya tenés cuenta? Iniciá sesión acá',
  AUTH_ERROR_GENERIC: 'Ocurrió un error al autenticar. Verificá los datos.',
  AUTH_SUBTITLE: 'Accedé al mismo historial en tu celular, computadora y tablet en tiempo real.',
} as const;
```

---

## 4. 🏷️ Categorías e Iconografía (`src/constants/categories.ts`)
## 6. 🏷️ Catálogo de Categorías e Iconografía (`src/constants/categories.ts`)

Cada categoría cuenta con un identificador único, etiqueta en español, icono de `lucide-react` y colores visuales asociados:
| ID | Nombre en Español | Ícono Lucide | Color Badge (Tailwind) | Naturaleza Predeterminada |
|---|---|---|---|---|
| `food` | Comida & Bebidas | `Utensils` | `bg-amber-100 text-amber-800 border-amber-200` | Cotidiano |
| `supermarket` | Supermercado | `ShoppingCart` | `bg-blue-100 text-blue-800 border-blue-200` | Cotidiano |
| `transport` | Transporte | `Bus` | `bg-sky-100 text-sky-800 border-sky-200` | Cotidiano |
| `leisure` | Salidas & Ocio | `PartyPopper` | `bg-purple-100 text-purple-800 border-purple-200` | Cotidiano |
| `clothing` | Ropa & Calzado | `Shirt` | `bg-pink-100 text-pink-800 border-pink-200` | Eventual |
| `tech` | Tecnología | `Laptop` | `bg-indigo-100 text-indigo-800 border-indigo-200` | Eventual |
| `subscriptions` | Suscripciones & Servicios | `CreditCard` | `bg-cyan-100 text-cyan-800 border-cyan-200` | Fijo |
| `health` | Salud & Farmacia | `HeartPulse` | `bg-rose-100 text-rose-800 border-rose-200` | Eventual |
| `aesthetics` | Estética & Cuidado | `Scissors` | `bg-teal-100 text-teal-800 border-teal-200` | Eventual |
| `education` | Cursos & Libros | `GraduationCap` | `bg-emerald-100 text-emerald-800 border-emerald-200` | Fijo / Eventual |
| `vices` | Vicios | `Flame` | `bg-amber-100 text-amber-900 border-amber-300` | Cotidiano |
| `other` | Otros Gastos | `Sparkles` | `bg-slate-100 text-slate-800 border-slate-200` | Cotidiano |

| ID | Nombre en Español | Ícono Lucide | Color Badge (Tailwind) |
|---|---|---|---|
| `food` | Comida & Bebidas | `Utensils` | `bg-amber-100 text-amber-800 border-amber-200` |
| `supermarket` | Supermercado | `ShoppingCart` | `bg-blue-100 text-blue-800 border-blue-200` |
| `transport` | Transporte | `Bus` | `bg-sky-100 text-sky-800 border-sky-200` |
| `leisure` | Salidas & Ocio | `PartyPopper` | `bg-purple-100 text-purple-800 border-purple-200` |
| `clothing` | Ropa & Calzado | `Shirt` | `bg-pink-100 text-pink-800 border-pink-200` |
| `tech` | Tecnología | `Laptop` | `bg-indigo-100 text-indigo-800 border-indigo-200` |
| `subscriptions` | Suscripciones & Servicios | `CreditCard` | `bg-cyan-100 text-cyan-800 border-cyan-200` |
| `health` | Salud & Farmacia | `HeartPulse` | `bg-rose-100 text-rose-800 border-rose-200` |
| `education` | Cursos & Libros | `GraduationCap` | `bg-emerald-100 text-emerald-800 border-emerald-200` |
| `other` | Otros Gastos | `Sparkles` | `bg-slate-100 text-slate-800 border-slate-200` |

---

## 5. 🧮 Utilidades de Cálculo y Métricas (`src/utils/metrics.ts`)
## 7. 🧮 Lógica Financiera y Fórmulas Matemáticas

Las métricas se calculan de manera pura y predecible a partir del listado de gastos y del filtro de período seleccionado:
### 7.1 Métricas de Período y Saldo Remanente
Para cualquier ciclo evaluado:
$$\text{Ingreso Asignado Total} = \text{Period.initialIncome} + \sum_{e \in \text{period}, e.\text{type}=\text{'income'}} e.\text{amount}$$
$$\text{Gasto Real Total} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, \neg e.\text{isFictitious}} e.\text{amount}$$
$$\text{Saldo Disponible} = \text{Ingreso Asignado Total} - \text{Gasto Real Total}$$

```typescript
import { Expense, PeriodFilterState, FinancialMetrics } from '../store/types';
import { isWithinPeriod } from './date';

export function calculateMetrics(
  expenses: Expense[], 
  filter: PeriodFilterState
): FinancialMetrics {
  const filtered = expenses.filter(expense => isWithinPeriod(expense.date, filter));

  let totalReal = 0;
  let totalDelayed = 0;
  let pendingTransfer = 0;
  let totalTransferred = 0;

  for (const exp of filtered) {
    if (exp.type === 'real') {
      totalReal += exp.amount;
    } else if (exp.type === 'delayed') {
      totalDelayed += exp.amount;
      if (exp.transferredAt === null) {
        pendingTransfer += exp.amount;
      } else {
        totalTransferred += exp.amount;
      }
    }
  }

  const totalAccounted = totalReal + totalDelayed;
  const delayRatePercentage = totalAccounted > 0 
    ? Math.round((totalDelayed / totalAccounted) * 100) 
    : 0;

  return {
    totalReal,
    totalDelayed,
    pendingTransfer,
    totalTransferred,
    totalAccounted,
    delayRatePercentage,
  };
}
```

---

## 6. 📤 Especificación de Exportación (`src/utils/export.ts`)

El módulo de exportación soporta dos canales de rendición:
El módulo de exportación soporta dos canales de rendición (WhatsApp y archivo CSV) con dos modalidades de visualización seleccionables por el usuario:
- **Modo Detallado (Estándar)**: Distingue claramente entre gastos reales efectivamente realizados y compras delayeadas/ahorradas, con sus estados de transferencia.
- **Modo Unificado (para rendir a padres)**: Presenta todos los movimientos como gastos comunes y calcula el monto presupuestario total a justificar/reponer, sin distinguir compras postergadas ni tags de transferencia.

### 6.1 Formato WhatsApp (Texto Plano con Markdown Nativo)
El texto generado no requiere edición manual y se estructura así:
---

### 6.1 Formato WhatsApp (Texto Plano con Markdown)
Genera el desglose organizado con asteriscos para negritas compatibles con WhatsApp:

#### Opción A: Modo Detallado
```text
📊 *Rendición de Gastos - DelaySpend*
🗓 *Período:* Septiembre 2026

💸 *Gastos Reales Realizados:*
• 11/09: Supermercado Coto - $14.500,00 [Supermercado]
• 09/09: Carga SUBE - $2.400,00 [Transporte]
• 05/09: Almuerzo facultad - $5.800,00 [Comida & Bebidas]

🛡 *Compras Delayeadas (Ahorradas):*
• 10/09: Auriculares Bluetooth - $35.000,00 [Tecnología] (Ya transferido ✅)
• 08/09: Zapatillas en promo - $42.000,00 [Ropa & Calzado] (Pendiente transferir ⏳)

📈 *Resumen Financiero:*
• Total gastado efectivamente: $22.700,00
• Total protegido/ahorrado: $77.000,00
• Monto a transferir a caja de ahorro: $42.000,00
• Total presupuestario rendido: $99.700,00

Generado con DelaySpend 🚀
```

#### Opción B: Modo Unificado (para padres)
```text
📊 *Rendición de Gastos - DelaySpend*
🗓 *Período:* Septiembre 2026

💸 *Detalle de Gastos del Período:*
• 11/09: Supermercado Coto - $14.500,00 [Supermercado]
• 10/09: Auriculares Bluetooth - $35.000,00 [Tecnología]
• 09/09: Carga SUBE - $2.400,00 [Transporte]
• 08/09: Zapatillas en promo - $42.000,00 [Ropa & Calzado]
• 05/09: Almuerzo facultad - $5.800,00 [Comida & Bebidas]

📈 *Resumen Financiero:*
• Total a rendir / reponer: $99.700,00

Generado con DelaySpend 🚀
```

---

### 6.2 Formato CSV para Hojas de Cálculo (Excel / Google Sheets)
- **Codificación**: UTF-8 con BOM (`\uFEFF`) obligatorio para que Microsoft Excel en Windows abra las tildes y caracteres en español sin romperse.
- **Delimitador**: Coma (`,`) o punto y coma (`;`). Se provee con escape de comillas según estándar RFC 4180.
- **Columnas**:
  1. `Fecha` (`YYYY-MM-DD`)
  2. `Tipo` (`Gasto Real` o `Compra Delayeada`)
  3. `Monto` (`0.00`)
  4. `Categoría` (Nombre en español)
  5. `Concepto / Detalle`
  6. `Estado de Transferencia` (`Transferido`, `Pendiente de transferir`, `No aplica`)
  7. `Fecha de Transferencia` (si aplica)
### 6.2 Formato CSV (Excel / Google Sheets)
- **Codificación**: UTF-8 con BOM (`\uFEFF`) obligatorio para evitar caracteres rotos en Windows.
- **Codificación**: UTF-8 con BOM (`\uFEFF`) obligatorio para evitar caracteres rotos en Microsoft Excel para Windows.
- **Escape RFC 4180**: Delimitado por comas con comillas de escape para descripciones con signos de puntuación.
- **Columnas**: `Fecha`, `Tipo`, `Monto`, `Categoría`, `Concepto / Detalle`, `Estado de Transferencia`, `Fecha de Transferencia`.
- **Columnas Modo Detallado**: `Fecha`, `Tipo`, `Monto`, `Categoría`, `Concepto / Detalle`, `Estado de Transferencia`, `Fecha de Transferencia`.
- **Columnas Modo Unificado**: `Fecha`, `Monto`, `Categoría`, `Concepto / Detalle`.

---

## 7. 📱 Reglas de Interfaz Mobile-First y Accesibilidad

1. **Diseño para 375px**: Todo elemento, padding y botón debe lucir perfecto en pantallas de 375px de ancho (iPhone SE).
2. **Keypad Numérico**: El campo de monto utiliza `<input type="text" inputMode="decimal" pattern="[0-9]*" />` para forzar la apertura del teclado numérico grande en iOS y Android.
3. **Touch Targets**: Botones, selectores y tarjetas interactivas cuentan con una altura mínima de `44px` para garantizar la operabilidad con una sola mano.
4. **Animaciones Fluidas**: Despliegue de modales y toasts con transiciones CSS nativas ligeras (`transition-all duration-200 ease-out`).
5. **No confirmaciones nativas**: Prohibido `window.confirm`, `window.alert` o `window.prompt`. Se utiliza `ConfirmDialog` y `Toaster`.
1. **Diseño para 375px**: Optimizado para uso con una sola mano sin scrolling horizontal.
2. **Keypad Numérico**: `<input type="text" inputMode="decimal" pattern="[0-9]*" />` para abrir el teclado numérico directamente.
3. **Touch Targets de 44px**: Todos los elementos interactivos cumplen con el estándar táctil ergonómico.
4. **No confirmaciones nativas**: Prohibido `window.confirm`. Se utiliza exclusivamente `ConfirmDialog`.

---

## 8. ☁️ Infraestructura Cloud, Sincronización y Seguridad

### 8.1 PostgreSQL con Row Level Security (RLS)
El backend en Supabase garantiza privacidad de grado bancario:
- RLS activo en `public.expenses`.
- Cada usuario solo puede ver, insertar, actualizar o eliminar filas donde `user_id = auth.uid()`.

### 8.2 Trigger PL/pgSQL de Auto-Confirmación
Para evitar la fricción y el límite gratuito de 2 correos/hora de Supabase SMTP, la base de datos cuenta con una función trigger que confirma automáticamente las cuentas al crearse:
```sql
create or replace function public.auto_confirm_user()
returns trigger as $$
begin
  new.confirmed_at = coalesce(new.confirmed_at, now());
  new.email_confirmed_at = coalesce(new.email_confirmed_at, now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_user();
```

### 8.3 Suscripciones WebSocket en Tiempo Real
Al vincular una cuenta, `useSyncStore` crea un canal dinámico `user_expenses_${userId}` escuchando eventos `postgres_changes` sobre `public.expenses`. Cualquier inserción o modificación en un dispositivo secundario se refleja en milisegundos en la UI local.
Al vincular una cuenta, `useSyncStore` crea un canal dinámico `user_expenses_${userId}` escuchando eventos `postgres_changes` sobre `public.expenses` y `public.periods`. Cualquier inserción o modificación en un dispositivo secundario se refleja en milisegundos en la UI local.

---

## 9. 🔄 Gestión de Ciclos, Cortes de Período y Asignación de Ingresos (v1.3.0)
## 4. 🧮 Fórmulas Matemáticas y Lógica Financiera

### 9.1 Concepto de "Reinicio de Contadores" sin Borrado
Para permitir un seguimiento por quincenas, meses o recargas de dinero (por ejemplo, plata enviada por los padres), DelaySpend implementa **Cortes de Período**:
1. **No se borra ningún dato**: Al apretar el botón *"Nuevo período / Reiniciar contadores"*, el ciclo vigente se cierra (fijando su `endDate`) y se crea un nuevo ciclo abierto (`endDate: null`) con fecha de inicio elegida por el usuario.
2. **Asignación de Ingreso (`initialIncome`)**: Al crear o editar un período, el usuario puede especificar un monto de dinero ingresado (ej. `$50.000`).
3. **Métricas de Balance**:
   - `initialIncome`: Fondo asignado al ciclo.
   - `totalReal`: Gastos efectivos que consumieron dicho fondo.
   - `totalDelayed`: Compras no realizadas (ahorro protegido).
   - `remainingBalance = initialIncome - totalReal`: Plata que todavía queda en la cuenta.
   - `freeBalance = initialIncome - totalReal - pendingTransfer`: Saldo libre tras separar lo que debe ir a la caja de ahorro.
4. **Corte Deshacible (Undo Cutoff)**: Si el usuario inició un período por equivocación, el botón *"Deshacer corte"* elimina el período recién abierto y reabre el período inmediatamente anterior, unificando todos los movimientos sin pérdida de información.
5. **Períodos Editables en Todo Momento**: Los períodos pasados y presentes pueden modificarse (fechas, nombre, ingreso asignado) y se pueden registrar o editar gastos retroactivos dentro de sus fechas recalculándose las métricas en tiempo real.
### 4.1 Saldo Remanente del Período
$$\text{Ingreso Efectivo} = \text{Period.initialIncome} + \sum_{\text{type}=\text{'income'}} \text{amount}$$
$$\text{Gasto Real Total} = \sum_{\text{type}=\text{'real'}} \text{amount}$$
$$\text{Saldo Disponible} = \text{Ingreso Efectivo} - \text{Gasto Real Total}$$

### 9.2 Esquema Relacional de Períodos (`public.periods`)
```sql
create table if not exists public.periods (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date,
  initial_income numeric(12, 2) not null default 0 check (initial_income >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
### 4.2 Ritmo Diario Corriente
Se calcula dividiendo el gasto corriente únicamente por los días transcurridos desde el inicio del período:
### 7.2 Ritmo Diario Corriente Real vs Proyectado con DelaySpend
Se aíslan fijos, eventuales, compras para la casa y gastos ficticios:
$$\text{díasActivos} = \max(1, \text{díasEntre}(\text{period.startDate}, \text{hoy}))$$
$$\text{spentDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, e.\text{nature}=\text{'daily'}} e.\text{amount}$$
$$\text{spentDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, e.\text{nature}=\text{'daily'}, \neg e.\text{isFictitious}} e.\text{amount}$$
$$\text{Promedio Diario Corriente Real} = \frac{\text{spentDaily}}{\text{díasActivos}}$$

alter table public.periods enable row level security;
### 4.3 Ritmo Proyectado con DelaySpend
Demuestra el impacto del autocontrol sumando las compras postergadas de naturaleza corriente:
$$\text{delayedDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'delayed'}, e.\text{nature}=\text{'daily'}} e.\text{amount}$$
$$\text{Ritmo Proyectado con DelaySpend} = \frac{\text{spentDaily} + \text{delayedDaily}}{\text{díasActivos}}$$

create policy "Users can manage their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
### 4.4 Ahorro Acumulado Histórico (Estrictamente Períodos Cerrados)
Para garantizar veracidad contable, **solo se auditan períodos con `endDate !== null` y `deletedAt === null`**:
### 7.3 Ahorro Acumulado Histórico (Estrictamente Períodos Cerrados)
Solo se auditan períodos cerrados (`endDate !== null` y `deletedAt === null`):
$$\text{Ahorro DelaySpend} = \sum_{p \in \text{Cerrados}} \left( \sum_{e \in p, e.\text{type}=\text{'delayed'}} e.\text{amount} + \sum_{e \in p, e.\text{type}=\text{'real'}} e.\text{savedExtraAmount} \right)$$
$$\text{Sobrante Ingresos (Neto)} = \sum_{p \in \text{Cerrados}} \left( \text{IngresoEfectivo}_p - \text{GastoReal}_p - \text{DelaySpend}_p \right)$$
$$\text{Ahorro Total Consolidado} = \text{Ahorro DelaySpend} + \text{Sobrante Ingresos} = \sum_{p \in \text{Cerrados}} \left( \text{IngresoEfectivo}_p - \text{GastoReal}_p \right)$$
*Nota:* El Sobrante de Ingresos representa el remanente presupuestario que ven los padres en la rendición de cuentas si las compras postergadas se hubiesen consumado. Al sumarse con el Ahorro DelaySpend, el ahorro total refleja fielmente el dinero real no gastado sin duplicar ningún concepto.

### 4.5 Asignación Diaria Sugerida en Metas
Para metas semanales o mensuales con límite fijado $L$:
$$\text{remanente} = L - \text{gastado}$$
$$\text{Asignación Diaria Sugerida} = \frac{\max(0, \text{remanente})}{\text{díasRestantes}}$$
### 7.4 Metas Presupuestarias Multitemporales
- **Por Ciclo (`cycle`):** Límite sobre el período activo.
- **Por Mes (`monthly`):** Límite para el mes calendario actual.
- **Por Semana (`weekly`):** Límite semanal (lunes a domingo).
- **Personalizado (`custom`):** Ventana de $N$ días corridos.

### 7.5 Fórmula del Balance Ficticio - Vicios
$$\text{Total Vicios} = \sum_{e \in \text{period}, e.\text{categoryId}=\text{'vices'}} e.\text{amount}$$
$$\text{Total Ficticios} = \sum_{e \in \text{period}, e.\text{isFictitious}=\text{true}} e.\text{amount}$$
$$\text{Balance Neto} = \text{Total Ficticios} - \text{Total Vicios}$$
- $\text{Balance} \ge 0$: Margen a favor (saldo cubierto ante los padres).
- $\text{Balance} < 0$: Saldo pendiente de compensar (faltan cargar máscaras contables).

---

## 10. 🎯 Corte por Gasto Específico y Ahorro Extra por Opción Más Barata (v1.4.0)
## 5. 🛡️ Sistema de Privacidad y Rendición a Padres
## 8. 🛡️ Sistema de Privacidad y Rendición a Padres

### 10.1 Corte por Gasto Específico (`cutoffExpenseId`)
Para permitir cortes de período de máxima precisión (incluso cuando existen múltiples movimientos en una misma fecha o quincena):
1. **Punto de Corte en el Historial**: El usuario puede abrir un nuevo período eligiendo un gasto específico como punto de corte, ya sea desde el modal *"Nuevo período"* (dropdown de selección) o directamente desde el menú de opciones del movimiento en el historial (*"Iniciar nuevo período acá"*).
2. **Reasignación de Gastos**:
   - El gasto seleccionado y todos los movimientos posteriores pasan a pertenecer al nuevo ciclo (`newPeriod.id`).
   - Todos los movimientos anteriores se asignan al ciclo cerrado anterior (`prevPeriodId`).
3. **Persistencia y Sincronización**:
   - Se añadió la columna `cutoff_expense_id` en `public.periods`.
   - Se añadió la columna `period_id` en `public.expenses`.
4. **Deshacer Corte**: Al ejecutar *"Deshacer corte"*, los gastos pertenecientes al período cancelado son reasignados de vuelta al período anterior, garantizando coherencia instantánea.
El módulo de exportación resuelve la necesidad de rendir gastos familiares con tres mecanismos de diseño:
El módulo de exportación resuelve la necesidad de rendir gastos familiares con total integridad:

### 10.2 Ahorro Extra DelaySpend por Opción Más Barata (`savedExtraAmount`)
En línea con la psicología conductual de la app: si el usuario decide comprar una opción más barata en lugar de una cara (ej: comprar un café al paso de $1.500 en vez de un café de especialidad de $4.500):
1. **Captura del Sobreprecio Evitado**: Al registrar un gasto real, se activa el toggle *"¿Elegiste una opción más barata?"* e ingresa el monto ahorrado (`savedExtraAmount`, ej: $3.000).
2. **Generación Automática del Gasto Complementario**: El sistema crea automáticamente un registro `delayed` complementario vinculado (`linkedExpenseId = realExpense.id`):
   - Tipo: `delayed`.
   - Monto: `$3.000` (el sobreprecio evitado).
   - Detalle: `"Ahorro opción más barata (Café al paso)"`.
   - Categoría y Fecha: Idénticas a la del gasto real.
3. **Impacto en Métricas y Rendición**:
   - Los `$1.500` van al gasto real efectivo (`totalReal`).
   - Los `$3.000` van al ahorro protegido (`totalDelayed`) y a la métrica estrella *"Monto a Transferir"* (`pendingTransfer`).
4. **Ciclo de Vida Sincronizado**:
   - Al editar el gasto real o su ahorro extra, el movimiento complementario se actualiza automáticamente.
   - Si se desactiva el ahorro o se borra el gasto real, el movimiento complementario se elimina en cascada.
1. **Eliminación Total de "DelaySpend":** Todos los reportes generados se encabezan con *"Rendición de Gastos"*, sin menciones al nombre de la app ni a compras postergadas.
2. **Exclusión Incondicional de Vicios:** Si `e.categoryId === 'vices'`, el gasto **nunca** se incluye en la rendición de padres (`unified: true`). Cero riesgo de exposición.
3. **Inclusión de Gastos Ficticios:** Los movimientos con `isFictitious === true` se listan como gastos ordinarios con su categoría nominal (ej: Comida) y suman al total a rendir, absorbiendo exactamente el dinero de los vicios.
4. **Censura / Enmascaramiento Automático:** Las categorías marcadas en `parentMaskedCategoryIds` (por ejemplo, *Estética*) se transforman en *"Otros Gastos"* en el reporte de WhatsApp y CSV, preservando el monto exacto.
5. **Aislamiento de Compras de la Casa:** Si el gasto tiene `nature === 'house'`, se le anexa el tag `[🏠 Para la casa]` y al pie del reporte se emite el total destinado a la familia.
6. **Tratamiento Estricto de Ingresos Extra (`type === 'income'`):**
   - **Nunca se cuentan como gastos:** Los ingresos de dinero recibidos no figuran en el listado de gastos a rendir ni se suman a `totalUnifiedAmount`.
   - **Desglose en Resumen Financiero:** Si hubo ingresos extra, el reporte detalla el ingreso base asignado, los ingresos extra recibidos y el ingreso total disponible, calculando el saldo remanente exacto (total disponible menos total a rendir).
   - **Sección Informativa Opcional:** En WhatsApp unificado se lista una sección independiente `📥 *Ingresos extra recibidos en el período:*`. En el CSV, se identifican unívocamente con `Tipo: 'Ingreso Extra'`.
7. **Configuración Dinámica (Tuerquita ⚙️):**
   - Switch de categoría: `showCategory` (booleano).
   - Recuadro "Mostrar etiqueta de naturaleza":
     - Switch maestro: `showNature` (booleano).
     - Sub-opciones de etiquetas: `showNatureTags` (`daily`, `fixed`, `eventual`, `house`). Determina de qué naturalezas mostrar el rótulo al lado de cada ítem.
   - Recuadro "Naturalezas a incluir en el reporte":
     - Filtro `includedNatures`: Permite excluir naturalezas enteras del reporte y del cálculo total a rendir.
   - Modo de resumen: `summaryMode` (`'full'` o `'total_only'`).
   - Persistencia: Se guarda en `localStorage` bajo `delayspend_parent_export_config_v1` para que las preferencias sean permanentes.

---

## 9. 🍩 Gráfico de Gastos por Categoría y Casilla DelaySpend (`CategoryDonutChart`)

1. **Casilla Marcable / Toggle:**
   - Ubicada en la parte superior del gráfico de dona en la vista de Analíticas.
   - Etiqueta: *"Incluir DelaySpend"* acompañada de un badge visual `🛡️ Ahorros`.
   - Estado: `includeDelayed` (`false` por defecto para preservar el enfoque de gastos reales estrictos hasta que el usuario decida activarlo).
2. **Cálculo de Slices y Totales:**
   - **Desmarcado (`includeDelayed === false`):** Agrupa únicamente gastos reales no ficticios (`exp.type === 'real' && !exp.isFictitious`). Centro de la dona muestra *"Total gastado"*.
   - **Marcado (`includeDelayed === true`):** Agrupa gastos reales + compras postergadas (`exp.type === 'delayed'`) + ahorros por opción más barata (`exp.savedExtraAmount`), excluyendo ingresos y gastos ficticios. Centro de la dona muestra *"Total c/ Delay"*.
3. **Desglose Interactivo por Categoría:**
   - Al tocar cualquier porción de la dona, se despliega la lista de movimientos de esa categoría.
   - Si `includeDelayed` está activo, las compras postergadas aparecen identificadas con un badge `🛡️ DelaySpend` y su monto en verde `+formatCurrency(exp.amount)` (reflejando ahorro), mientras los gastos reales muestran `-formatCurrency(exp.amount)`.

---

## 10. 🛡️ Categorización Completa de Compras Postergadas (`delayed`)

1. **Naturaleza del Gasto Desbloqueada:**
   - El selector de naturaleza (`nature`: Cotidiano, Fijo, Eventual, Para la casa) ahora está habilitado tanto para gastos reales como para compras postergadas (`type !== 'income'`).
   - Normalizado y sanitizado en `useExpenseStore`, sincronizado con Supabase (`nature`, `is_recurring`).
2. **Subcategorías, Tags y Recurrencia:**
   - Las compras postergadas admiten subcategorías dinámicas, etiquetas personalizadas (tags) y marcación como gasto fijo/recurrente (`isRecurring`).
3. **Identificación en Historial:**
   - Los ítems `delayed` muestran los badges correspondientes de su naturaleza (`Para la casa`, `Eventual`, `Fijo`) junto con el badge nativo de compra postergada.

---

## 11. 📱 Reglas de Accesibilidad y UI Mobile-First
## 11. 🧭 Tarjeta de Auditoría por Naturaleza de Gasto (`ExpenseNatureCard`)

1. **Interactividad Universal (4 Naturalezas):**
   - Las 4 pastillas (`Cotidianos`, `Fijos`, `Eventuales`, `Para la casa`) son interactivas y desplegables con un toque.
   - Al tocar cualquiera de ellas, se expande un desglose detallado con todos los movimientos (gastos reales y compras postergadas) pertenecientes a esa naturaleza.
   - Cuentan con indicador de estado (`ChevronDown`/`ChevronUp`), contador de movimientos y anillo de selección activo.
2. **Prevención de Desbordes y Responsive Design:**
   - Montos y textos protegidos con `min-w-0`, `truncate` y `line-clamp` para anchos móviles estrechos (iPhone SE 375px).
   - Desglose con scroll interno acotado (`max-h-60 overflow-y-auto`) para no alargar desmedidamente la tarjeta.
   - Truncado riguroso de descripciones en Flexbox con `min-w-0 flex-1` para que el monto a la derecha nunca sea expulsado de la pantalla.

---

## 12. 📱 Reglas de Accesibilidad y UI Mobile-First

1. **Área táctil mínima:** Todo elemento interactivo cuenta con un área táctil mínima de 44×44px (`min-h-[44px]`).
2. **Operatividad con una sola mano:** La interacción principal ocurre mediante `BottomSheet` anclados a la parte inferior de la pantalla.
3. **Viewport prioritario:** 375px de ancho (iPhone SE / estándar móvil).
4. **Respeto de Zonas Seguras (*Safe Areas*):** Uso estricto de padding para notch superior y barra inferior de navegación en iOS (`pb-safe`, `pt-safe`).
5. **No Diálogos Nativos:** Prohibido el uso de `window.alert`, `window.confirm` o `window.prompt`. Toda interacción utiliza `ConfirmDialog` o `Toaster`.

---
*Fin de la Especificación de Diseño — DelaySpend v1.6.0*

## 13. 🔄 Resolución Dinámica y Visibilidad de Gastos entre Períodos

1. **Resolución Cronológica de Períodos (`findPeriodForDate`):**
   - La asignación de un gasto a un período (`periodId`) no depende rígidamente del período que el usuario esté mirando al abrir el formulario, sino de la fecha (`date`) del gasto.
   - Si un usuario crea o edita un gasto con fecha correspondiente a un período diferente (ej. fecha del período vigente estando en la vista de un período pasado), el sistema resuelve automáticamente el ciclo cronológico correcto.
   - En fechas límite compartidas (ej. día de corte exacto), se respeta la preferencia si coincide con alguno de los ciclos; en caso contrario, se asigna al ciclo más reciente/abierto.

2. **Resiliencia y Auto-recuperación (`isExpenseInPeriod`):**
   - Si un gasto posee un `periodId` que apunta a un ciclo cuyas fechas no abarcan la fecha del gasto (o cuyo ciclo fue eliminado), el evaluador descarta el `periodId` inválido y acepta el gasto en el ciclo cuyos límites de fecha sí lo contienen.
   - Los gastos nunca desaparecen ni quedan huérfanos entre períodos.
   - Al cargar la aplicación, `repairMismatchedExpensePeriods` normaliza cualquier desfasaje existente en la base de datos local y remota.

3. **Navegación Fluida:**
   - Si el usuario registra un gasto perteneciente a un ciclo distinto al visualizado actualmente, la app conmuta automáticamente la vista al ciclo de destino para que el movimiento sea visible en pantalla al instante, complementado con un toast descriptivo (`... en [Nombre Período]`).

---
*Fin de la Especificación de Diseño — DelaySpend v1.7.0*

## 14. ⏰ Recordatorios de Gastos y Pedidos Periódicos

1. **Aislamiento Contable Absoluto:**
   - Los recordatorios no son gastos: residen en un store desacoplado (`useReminderStore`) persistido en `delayspend_reminders_v1`.
   - No modifican métricas financieras, saldos, proyecciones ni metas presupuestarias hasta que el usuario decida explícitamente incorporarlos al historial de gastos.

2. **Reglas de Recurrencia y Vencimiento:**
   - **Periodicidad flexible:** Sin repetición (`none`), intervalo personalizado en días (`custom_days` con `recurrenceIntervalDays`), semanal (`weekly`) o mensual (`monthly`).
   - **Condiciones de fin:** Indefinido (`never`), por fecha tope (`after_date` con `endDate`) o por cantidad máxima de ocurrencias (`after_occurrences` con `maxOccurrences`).
   - **Avance inteligente (`calculateNextReminderDate`):** Si un recordatorio se atiende con días de retraso, la próxima fecha se calcula a partir de hoy para no encimar avisos consecutivos.

3. **Interacción y Ciclo de Vida:**
   - **Banner persistente en Dashboard (`ReminderBannerCard`):** Se muestra durante el día del vencimiento y todos los días posteriores hasta que el usuario decida ignorar o incorporar el recordatorio.
   - **Acción "Ignorar":** Avanza el recordatorio al siguiente ciclo (`nextDate`), incrementa el contador de ocurrencias y oculta el aviso hasta la próxima fecha programada.
   - **Acción "Incorporar":** Abre la hoja nativa estándar `AddExpenseSheet` con el monto, nombre, categoría, subcategoría y naturaleza precargados (todos editables). Al guardar el gasto exitosamente, se marca el recordatorio como incorporado y avanza a la siguiente fecha. Si el usuario cancela o cierra la hoja sin confirmar, el recordatorio permanece pendiente y visible en el banner.
   - **Campana de notificaciones en Cabecera (`Header`):** Muestra una insignia con el conteo de recordatorios vencidos/pendientes con animación de atención y acceso directo al gestor.
   - **Centro de Gestión (`RemindersModal` y `ReminderFormModal`):** Accesible desde la campana o desde la sección de Ajustes, permite listar, pausar/activar, editar, eliminar y crear nuevos recordatorios.

---
*Fin de la Especificación de Diseño — DelaySpend v1.8.0*
