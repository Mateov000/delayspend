# DelaySpend — Especificación Técnica de Diseño y Dominio

> **Documento:** `openspec/design.md`  
> **Versión:** 1.5.0 · **Estado:** Especificación Activa y Validada en Producción  
> **Metodología:** Spec-Driven (OpenSpec / ChangeSpec)

---

## 1. 📐 Modelo de Dominio y Contratos TypeScript (`src/store/types.ts`)

El sistema DelaySpend modela las finanzas personales desde una perspectiva de economía conductual, dividiendo los movimientos según su propósito real, su impacto en el autocontrol y su horizonte temporal.

### 1.1 Tipos Primitivos y Enums

```typescript
/** Tipo de movimiento financiero */
export type ExpenseType = 
  | 'real'      // Dinero efectivamente desembolsado
  | 'delayed'   // Compra impulsiva postergada (ahorro en formación)
  | 'income';   // Dinero extra ingresado al período

/** Naturaleza del gasto para aislar distorsiones en los promedios diarios */
export type ExpenseNature = 
  | 'daily'     // Cotidiano / Corriente: café, almuerzo, salidas, kiosco
  | 'fixed'     // Fijo / Recurrente: gimnasio, alquiler, internet, abonos
  | 'eventual'  // Esporádico / Eventual: corte de pelo, ropa de abrigo, dentista
  | 'house';    // Para la casa / Familia: verdulería o compras para el hogar

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
  transferredAt: string | null; // ISO 8601 si fue marcado como transferido a ahorro
  createdAt: string;            // ISO 8601 de creación
  updatedAt: string;            // ISO 8601 de última edición (clave para resolución LWW)
  periodId?: string | null;     // ID del ciclo al que pertenece
  savedExtraAmount?: number;    // Sobreprecio evitado por elegir opción más barata
  tags?: string[];              // Etiquetas libres
  nature?: ExpenseNature;       // 'daily' | 'fixed' | 'eventual' | 'house'
  installmentGroupId?: string | null; // UUID para cuotas
  installmentNumber?: number | null;  // Número de cuota actual
  installmentTotal?: number | null;   // Cantidad total de cuotas
  isRecurring?: boolean;        // Compatibilidad legacy
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
```

### 1.3 Contratos de Métricas y Exportación

```typescript
export interface FinancialMetrics {
  totalReal: number;            // Suma de gastos reales
  totalDelayed: number;         // Suma de compras postergadas
  pendingTransfer: number;      // Postergados aún no transferidos a caja de ahorro
  totalTransferred: number;     // Postergados ya consolidados en caja de ahorro
  totalAccounted: number;       // Total presupuestario rendido (real + delayed)
  delayRatePercentage: number;  // Porcentaje de ahorro sobre el presupuesto
  initialIncome: number;        // Presupuesto asignado al período
  remainingBalance: number;     // initialIncome - totalReal (saldo libre)
}

export interface HistoricalSavings {
  delaySpendSavings: number;    // Compras evitadas en períodos cerrados
  incomeLeftoverSavings: number;// Sobrante de ingresos en períodos cerrados
  totalSavings: number;         // Suma consolidada de ambos ahorros
  closedPeriodsCount: number;   // Cantidad de períodos cerrados auditados
}

export interface ParentExportConfig {
  showCategory?: boolean;       // Incluir o no la categoría en cada ítem
  showNature?: boolean;         // Incluir etiqueta de naturaleza [🏠 Para la casa], etc.
  includedNatures?: Record<ExpenseNature, boolean>; // Casillas de qué naturalezas exportar
  summaryMode?: 'full' | 'total_only'; // Detalle completo vs solo total a rendir
}
```

---

## 2. 🏗️ Arquitectura del Sistema y Stores de Estado (Zustand)

La aplicación implementa una arquitectura **Local-First Híbrida**:
1. **Cero latencia (0ms):** Toda lectura o mutación se resuelve inmediatamente en memoria mediante stores de Zustand y se persiste en `localStorage`.
2. **Buffer reactivo offline:** La aplicación opera de forma autónoma sin red. Si la conexión cae, las operaciones quedan en cola.
3. **Replicación continua en segundo plano:** Un bus de eventos desacoplado (`registerSyncListener`) despacha las mutaciones hacia el backend PostgreSQL en Supabase.

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
- **`useBudgetStore`:** Metas multitemporales (`cycle`, `monthly`, `weekly`, `custom`), límites globales y presupuestos por rubro.
- **`useCategoryStore`:** Catálogo de categorías, creación de rubros personalizados y lista de enmascaramiento parental (`parentMaskedCategoryIds`).
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
  installment_total integer
);

create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_expenses_user_updated on public.expenses(user_id, updated_at desc);
create index if not exists idx_expenses_period on public.expenses(period_id);

alter table public.expenses enable row level security;

create policy "Users manage their own expenses"
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

create policy "Users manage their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.periods;
```

### 3.3 Trigger de Auto-Confirmación de Cuentas (Bypass SMTP)

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

---

## 4. 🧮 Fórmulas Matemáticas y Lógica Financiera

### 4.1 Saldo Remanente del Período
$$\text{Ingreso Efectivo} = \text{Period.initialIncome} + \sum_{\text{type}=\text{'income'}} \text{amount}$$
$$\text{Gasto Real Total} = \sum_{\text{type}=\text{'real'}} \text{amount}$$
$$\text{Saldo Disponible} = \text{Ingreso Efectivo} - \text{Gasto Real Total}$$

### 4.2 Ritmo Diario Corriente
Se calcula dividiendo el gasto corriente únicamente por los días transcurridos desde el inicio del período:
$$\text{díasActivos} = \max(1, \text{díasEntre}(\text{period.startDate}, \text{hoy}))$$
$$\text{spentDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'real'}, e.\text{nature}=\text{'daily'}} e.\text{amount}$$
$$\text{Promedio Diario Corriente Real} = \frac{\text{spentDaily}}{\text{díasActivos}}$$

### 4.3 Ritmo Proyectado con DelaySpend
Demuestra el impacto del autocontrol sumando las compras postergadas de naturaleza corriente:
$$\text{delayedDaily} = \sum_{e \in \text{period}, e.\text{type}=\text{'delayed'}, e.\text{nature}=\text{'daily'}} e.\text{amount}$$
$$\text{Ritmo Proyectado con DelaySpend} = \frac{\text{spentDaily} + \text{delayedDaily}}{\text{díasActivos}}$$

### 4.4 Ahorro Acumulado Histórico (Estrictamente Períodos Cerrados)
Para garantizar veracidad contable, **solo se auditan períodos con `endDate !== null` y `deletedAt === null`**:
$$\text{Ahorro Postergado} = \sum_{p \in \text{Cerrados}} \sum_{e \in p} \left( \mathbb{I}(e.\text{type}=\text{'delayed'}) \cdot e.\text{amount} + e.\text{savedExtraAmount} \right)$$
$$\text{Sobrante Ingresos} = \sum_{p \in \text{Cerrados}} \max\left(0, \text{IngresoEfectivo}_p - \text{GastoReal}_p\right)$$
$$\text{Ahorro Total Consolidado} = \text{Ahorro Postergado} + \text{Sobrante Ingresos}$$

### 4.5 Asignación Diaria Sugerida en Metas
Para metas semanales o mensuales con límite fijado $L$:
$$\text{remanente} = L - \text{gastado}$$
$$\text{Asignación Diaria Sugerida} = \frac{\max(0, \text{remanente})}{\text{díasRestantes}}$$

---

## 5. 🛡️ Sistema de Privacidad y Rendición a Padres

El módulo de exportación resuelve la necesidad de rendir gastos familiares con tres mecanismos de diseño:

1. **Eliminación Total de "DelaySpend":** Todos los reportes generados se encabezan con *"Rendición de Gastos"*, sin menciones al nombre de la app ni a compras postergadas.
2. **Censura / Enmascaramiento Automático:** Las categorías incluidas en `parentMaskedCategoryIds` (por ejemplo, *Estética*) se transforman en *"Otros Gastos"* en el reporte de WhatsApp y CSV, preservando el monto exacto para que la rendición no descuadre.
3. **Aislamiento de Compras de la Casa:** Si el gasto tiene `nature === 'house'`, se le anexa el tag `[🏠 Para la casa]` y al pie del reporte se emite una línea con el total destinado a la familia.
4. **Configuración Dinámica (Tuerquita ⚙️):**
   - Switch de categoría: `showCategory` (booleano).
   - Switch de naturaleza: `showNature` (booleano).
   - Filtro de naturalezas: `includedNatures` (diccionario por `ExpenseNature`).
   - Modo de resumen: `summaryMode` (`'full'` o `'total_only'`).
   - Persistencia: Se guarda en `localStorage` bajo `delayspend_parent_export_config_v1` para que las preferencias sean permanentes.

---

## 6. 📱 Reglas de Accesibilidad y UI Mobile-First

1. **Área táctil mínima:** Todo elemento interactivo (botones, selectores, checkboxes, switches) cuenta con un área táctil mínima de 44×44px (`min-h-[44px]`).
2. **Operatividad con una sola mano:** La interacción principal (formulario flotante, confirmaciones, hojas de filtros) ocurre mediante `BottomSheet` anclados a la parte inferior de la pantalla.
3. **Viewport prioritario:** 375px de ancho (iPhone SE / estándar móvil). Se escala progresivamente mediante breakpoints de Tailwind (`sm:`, `md:`).
4. **Respeto de Zonas Seguras (*Safe Areas*):** Uso estricto de padding para notch superior y barra inferior de navegación en iOS (`pb-safe`, `pt-safe`).
5. **No Diálogos Nativos:** Prohibido el uso de `window.alert`, `window.confirm` o `window.prompt`. Toda interacción utiliza `ConfirmDialog` o `Toaster`.

---
*Fin de la Especificación de Diseño — DelaySpend v1.5.0*
