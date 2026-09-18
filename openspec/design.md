# DelaySpend — Especificación Técnica de Diseño y Dominio

> **Documento:** `openspec/design.md`  
> **Versión:** 1.6.0 · **Estado:** Especificación Activa y Validada en Producción  
> **Metodología:** Spec-Driven (OpenSpec / ChangeSpec)

---

## 1. 📐 Modelo de Dominio y Contratos TypeScript (`src/store/types.ts`)

El sistema DelaySpend modela las finanzas personales desde una perspectiva de economía conductual, dividiendo los movimientos según su propósito real, su impacto en el autocontrol, su naturaleza operativa y los niveles de privacidad requeridos.

### 1.1 Tipos Primitivos y Enums

```typescript
/** Tipo de movimiento financiero */
export type ExpenseType = 
  | 'real'      // Dinero efectivamente desembolsado
  | 'delayed'   // Compra impulsiva postergada (ahorro protegido en formación)
  | 'income';   // Dinero extra ingresado al ciclo actual

/** Naturaleza del gasto para aislar distorsiones en los promedios diarios */
export type ExpenseNature = 
  | 'daily'     // Cotidiano / Corriente: café, almuerzo, salidas, kiosco
  | 'fixed'     // Fijo / Recurrente: gimnasio, alquiler, internet, abonos
  | 'eventual'  // Esporádico / Eventual: corte de pelo, ropa de abrigo, dentista
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
  icon: string;         // Nombre del ícono en lucide-react
  color: string;        // Clases de Tailwind CSS para bordes y texto
  badgeBg: string;      // Clase de fondo de insignia
  textColor: string;
  isCustom?: boolean;   // true si fue creada por el usuario
}

export interface Expense {
  id: string;                   // UUID v4 único
  type: ExpenseType;            // 'real' | 'delayed' | 'income'
  amount: number;               // Monto positivo con 2 decimales
  description: string;          // Concepto o justificación de compra
  categoryId: CategoryId;       // Referencia a Category
  date: string;                 // ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 si fue transferido a ahorro
  createdAt: string;            // ISO 8601 de creación
  updatedAt: string;            // ISO 8601 de última edición (clave para LWW)
  periodId?: string | null;     // ID del ciclo al que pertenece
  savedExtraAmount?: number;    // Sobreprecio evitado por elegir opción más barata
  tags?: string[];              // Etiquetas libres
  nature?: ExpenseNature;       // 'daily' | 'fixed' | 'eventual' | 'house'
  installmentGroupId?: string | null; // UUID de agrupación para compras en cuotas
  installmentNumber?: number | null;  // Número de cuota actual
  installmentTotal?: number | null;   // Cantidad total de cuotas
  isRecurring?: boolean;        // Compatibilidad legacy
  subcategory?: string;         // Subcategoría dinámica (ej: 'Puchos' en Vicios)
  isFictitious?: boolean;       // Gasto ficticio (máscara contable para rendición a padres)
  deletedAt?: string | null;    // Soft-delete para sincronización
}

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

### 1.3 Contratos de Métricas, Presupuestos y Exportación

```typescript
export interface FinancialMetrics {
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
  totalSavings: number;         // Ahorro total acumulado en períodos cerrados
  delaySpendSavings: number;    // Ahorro total por postergaciones (evitados + sobreprecios)
  delaySpendDirect: number;     // Desglose: compras postergadas no consumadas
  delaySpendCheaper: number;    // Desglose: compras por opción más barata
  incomeLeftoverSavings: number;// Sobrante neto de ingresos en períodos cerrados
  closedPeriodsCount: number;   // Cantidad de períodos cerrados auditados
}

export interface ParentExportConfig {
  showCategory?: boolean;       // Incluir o no la categoría en cada ítem
  showNature?: boolean;         // Interruptor maestro: mostrar etiquetas de naturaleza
  showNatureTags?: Record<ExpenseNature, boolean>; // De qué naturalezas mostrar etiqueta
  includedNatures?: Record<ExpenseNature, boolean>; // Qué naturalezas incluir en el total
  summaryMode?: 'full' | 'total_only'; // Detalle completo vs solo total a rendir
}
```

### 1.4 Reglas de Privacidad Estricta: Categoría Vicios y Gastos Ficticios

1. **Categoría Nativa `vices`:**
   - Identificador `vices`, ícono `Flame` (llama), color ámbar (`bg-amber-100 text-amber-900 border-amber-300`).
   - Soporta subcategorías dinámicas creadas por el usuario (default: `['Puchos']`), almacenadas en `useCategoryStore.viceSubcategories`.
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

---

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

### 2.1 Stores del Sistema:
- **`useExpenseStore`:** Colección de gastos, CRUD inmutable, marca de transferencia, soporte de subcategorías y gastos ficticios, y hooks de sync.
- **`usePeriodStore`:** Administración de ciclos de vida de períodos, corte por fecha, corte por gasto específico (`cutoffExpenseId`) y reversión (*undo*).
- **`useBudgetStore`:** Metas multitemporales (`cycle`, `monthly`, `weekly`, `custom`), límites globales y presupuestos por rubro.
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
  type text not null check (type in ('real', 'delayed', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  period_id uuid references public.periods(id) on delete set null,
  saved_extra_amount numeric(12, 2) check (saved_extra_amount >= 0),
  nature text not null default 'daily' check (nature in ('daily', 'fixed', 'eventual', 'house')),
  tags text[],
  installment_group_id uuid,
  installment_number integer,
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

create policy "Users can manage their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.expenses;
```

### 3.2 Tabla `public.periods`

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

create index if not exists idx_periods_user on public.periods(user_id, start_date desc);

alter table public.periods enable row level security;

create policy "Users can manage their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.periods;
```

### 3.3 Historial de Migraciones SQL en Supabase
1. `20260914000001_initial_schema.sql`: Estructura inicial de `expenses`, RLS y suscripción Realtime.
2. `20260914000002_auto_confirm_users.sql`: Trigger `auto_confirm_user` para bypass SMTP en registro.
3. `20260916000003_add_periods_and_features.sql`: Tabla `periods`, columnas `period_id`, `cutoff_expense_id`, `saved_extra_amount`, `nature`, `installment_*`.
4. `20260918000004_add_fictitious_and_subcategory.sql`: Columnas `is_fictitious` y `subcategory` en `expenses` con índice optimizado.

---

## 4. 🏛️ Arquitectura de Componentes de Interfaz

La aplicación opera como una Single Page Application (SPA) Mobile-First centrada con ancho máximo `max-w-md` en pantallas grandes.

### 4.1 Árbol de Componentes

```
App
├── Layout
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
├── AddExpenseSheet (BottomSheet modal)
│   └── ExpenseForm (Toggle Real/Delayed/Income, Ficticio, Subcategorías, Naturaleza)
├── ExportPanel (Modal con configuración ⚙️, WhatsApp y CSV)
├── ConfirmDialog (Diálogo accesible sin window.confirm)
└── Toaster (Notificaciones flotantes)
```

---

## 5. 💬 Tabla de Textos y Tono de Comunicación (`src/constants/strings.ts`)

La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`).
Se centralizan títulos, etiquetas, placeholders y mensajes de confirmación para evitar textos literales sueltos.

---

## 6. 🏷️ Catálogo de Categorías e Iconografía (`src/constants/categories.ts`)

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

---

## 7. 🧮 Lógica Financiera y Fórmulas Matemáticas

### 7.1 Métricas de Período y Saldo Remanente
Para cualquier ciclo evaluado:
$$\text{Ingreso Asignado Total} = \text{Period.initialIncome} + \sum_{e \in \text{period}, e.\text{type}=\text{'income'}} e.\text{amount}$$
$$\text{Gasto Real Total} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, \neg e.\text{isFictitious}} e.\text{amount}$$
$$\text{Saldo Disponible} = \text{Ingreso Asignado Total} - \text{Gasto Real Total}$$

### 7.2 Ritmo Diario Corriente Real vs Proyectado con DelaySpend
Se aíslan fijos, eventuales, compras para la casa y gastos ficticios:
$$\text{díasActivos} = \max(1, \text{díasEntre}(\text{period.startDate}, \text{hoy}))$$
$$\text{spentDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, e.\text{nature}=\text{'daily'}, \neg e.\text{isFictitious}} e.\text{amount}$$
$$\text{Promedio Diario Corriente Real} = \frac{\text{spentDaily}}{\text{díasActivos}}$$
$$\text{delayedDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'delayed'}, e.\text{nature}=\text{'daily'}} e.\text{amount}$$
$$\text{Ritmo Proyectado con DelaySpend} = \frac{\text{spentDaily} + \text{delayedDaily}}{\text{díasActivos}}$$

### 7.3 Ahorro Acumulado Histórico (Estrictamente Períodos Cerrados)
Solo se auditan períodos cerrados (`endDate !== null` y `deletedAt === null`):
$$\text{Ahorro DelaySpend} = \sum_{p \in \text{Cerrados}} \left( \sum_{e \in p, e.\text{type}=\text{'delayed'}} e.\text{amount} + \sum_{e \in p, e.\text{type}=\text{'real'}} e.\text{savedExtraAmount} \right)$$
$$\text{Sobrante Ingresos (Neto)} = \sum_{p \in \text{Cerrados}} \left( \text{IngresoEfectivo}_p - \text{GastoReal}_p - \text{DelaySpend}_p \right)$$
$$\text{Ahorro Total Consolidado} = \text{Ahorro DelaySpend} + \text{Sobrante Ingresos} = \sum_{p \in \text{Cerrados}} \left( \text{IngresoEfectivo}_p - \text{GastoReal}_p \right)$$

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

## 8. 🛡️ Sistema de Privacidad y Rendición a Padres

El módulo de exportación resuelve la necesidad de rendir gastos familiares con total integridad:

1. **Eliminación Total de "DelaySpend":** Todos los reportes generados se encabezan con *"Rendición de Gastos"*, sin menciones al nombre de la app ni a compras postergadas.
2. **Exclusión Incondicional de Vicios:** Si `e.categoryId === 'vices'`, el gasto **nunca** se incluye en la rendición de padres (`unified: true`). Cero riesgo de exposición.
3. **Inclusión de Gastos Ficticios:** Los movimientos con `isFictitious === true` se listan como gastos ordinarios con su categoría nominal (ej: Comida) y suman al total a rendir, absorbiendo exactamente el dinero de los vicios.
4. **Censura / Enmascaramiento Automático:** Las categorías marcadas en `parentMaskedCategoryIds` (por ejemplo, *Estética*) se transforman en *"Otros Gastos"* en el reporte de WhatsApp y CSV, preservando el monto exacto.
5. **Aislamiento de Compras de la Casa:** Si el gasto tiene `nature === 'house'`, se le anexa el tag `[🏠 Para la casa]` y al pie del reporte se emite el total destinado a la familia.
6. **Configuración Dinámica (Tuerquita ⚙️):**
   - Switch de categoría: `showCategory` (booleano).
   - Recuadro "Mostrar etiqueta de naturaleza":
     - Switch maestro: `showNature` (booleano).
     - Sub-opciones de etiquetas: `showNatureTags` (`daily`, `fixed`, `eventual`, `house`). Determina de qué naturalezas mostrar el rótulo al lado de cada ítem.
   - Recuadro "Naturalezas a incluir en el reporte":
     - Filtro `includedNatures`: Permite excluir naturalezas enteras del reporte y del cálculo total a rendir.
   - Modo de resumen: `summaryMode` (`'full'` o `'total_only'`).
   - Persistencia: Se guarda en `localStorage` bajo `delayspend_parent_export_config_v1`.

---

## 9. 📱 Reglas de Accesibilidad y UI Mobile-First

1. **Área táctil mínima:** Todo elemento interactivo cuenta con un área táctil mínima de 44×44px (`min-h-[44px]`).
2. **Operatividad con una sola mano:** La interacción principal ocurre mediante `BottomSheet` anclados a la parte inferior de la pantalla.
3. **Viewport prioritario:** 375px de ancho (iPhone SE / estándar móvil).
4. **Respeto de Zonas Seguras (*Safe Areas*):** Uso estricto de padding para notch superior y barra inferior de navegación en iOS (`pb-safe`, `pt-safe`).
5. **No Diálogos Nativos:** Prohibido el uso de `window.alert`, `window.confirm` o `window.prompt`. Toda interacción utiliza `ConfirmDialog` o `Toaster`.

---
*Fin de la Especificación de Diseño — DelaySpend v1.6.0*
