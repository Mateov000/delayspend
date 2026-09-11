# DelaySpend — Diseño Técnico y Especificación de Dominio

**Documento:** `openspec/design.md`  
**Versión:** 1.1.0 · **Estado:** Implementado en Producción  
**Metodología:** OpenSpec / ChangeSpec  

---

## 1. 📐 Modelo de Datos, Esquema Dual y Contratos de Store

El sistema opera bajo un paradigma **Local-First con Sincronización en la Nube**. La capa de almacenamiento está dividida en dos niveles:
1. **Capa Local (Caché y Buffer Offline de 0ms)**: Gestionada por Zustand con el middleware `persist` en `localStorage` (clave `delayspend_storage_v1`). Garantiza latencia cero y total disponibilidad offline.
2. **Capa Cloud (Fuente de Verdad Persistente)**: Base de datos relacional PostgreSQL en Supabase (`sa-east-1`, São Paulo), protegida con Row Level Security (RLS) y sincronizada en tiempo real mediante WebSockets.

---

### 1.1 Tipos de Dominio TypeScript (`src/store/types.ts`)

```typescript
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
  id: string; // UUID v4 (coincidente con PostgreSQL UUID)
  type: ExpenseType; // 'real': plata gastada | 'delayed': compra postergada
  amount: number; // Monto mayor a 0, redondeado a 2 decimales
  description: string; // Concepto o justificación de la compra
  categoryId: CategoryId; // Categoría normalizada
  date: string; // Formato ISO 'YYYY-MM-DD'
  transferredAt: string | null; // ISO 8601 de la transferencia (null si no aplica o pendiente)
  createdAt: string; // ISO 8601 de creación
  updatedAt: string; // ISO 8601 de última edición (clave para LWW)
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
```

---

### 1.2 Esquema Relacional PostgreSQL en Supabase (`public.expenses`)

```sql
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('real', 'delayed')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft delete para propagar borrados a otros dispositivos
);

-- Índices de alto rendimiento
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_expenses_user_updated on public.expenses(user_id, updated_at desc);

-- Políticas RLS
alter table public.expenses enable row level security;

create policy "Users can view their own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert their own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update their own expenses" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- Replicación en tiempo real
alter publication supabase_realtime add table public.expenses;
```

---

### 1.3 Contrato del Store Financiero (`src/store/useExpenseStore.ts`)

```typescript
export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  description: string;
  categoryId: CategoryId;
  date: string;
}

export interface ExpenseState {
  expenses: Expense[];
  
  // Acciones CRUD
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: Partial<ExpenseInput>) => void;
  deleteExpense: (id: string) => void;
  
  // Acciones de Ahorro y Rendición (Métrica estrella)
  markAllPendingAsTransferred: () => void;
  toggleTransferred: (id: string) => void;
  
  // Mantenimiento y Migración
  resetAllData: () => void;
  importExpenses: (expenses: Expense[]) => void;
}

// Hook desacoplado de sincronización reactiva
type SyncListener = (action: 'push' | 'delete', item: Expense | string) => void;
export function registerSyncListener(listener: SyncListener): void;
```

---

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
```

---

### 1.5 Contrato del Store de Sincronización (`src/store/useSyncStore.ts`)

```typescript
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'guest';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  setStatus: (status: SyncStatus) => void;
  initializeSync: (userId: string | null) => () => void;
  pushExpense: (expense: Expense, userId: string) => Promise<void>;
  deleteRemoteExpense: (id: string, userId: string) => Promise<void>;
  syncAllWithCloud: (userId: string) => Promise<void>;
}
```

---

### 1.6 Reglas de Negocio, Concurrencia y Sincronización

1. **Inmutabilidad y 0ms Local-First**: Las mutaciones actualizan de inmediato el estado de Zustand y se persisten en `localStorage`. Nunca se espera una respuesta de red para actualizar la UI.
2. **Push Asíncrono Desacoplado**: Al ocurrir una mutación local, el store dispara un evento mediante `syncListener`. Si el usuario tiene sesión activa y conexión, `useSyncStore` realiza un `upsert` en Supabase en segundo plano.
3. **Resolución de Conflictos Last-Write-Wins (LWW)**: Tanto en el merge inicial como en eventos en tiempo real, si existen dos versiones de un mismo registro (`id`), prevalece aquella con el timestamp `updatedAt` más reciente.
4. **Propagación de Borrados con Soft-Delete**: Al eliminar un registro en la nube, se estampa `deleted_at = now()` para que otros dispositivos conectados sepan que deben eliminarlo de su caché local antes de la purga física.
5. **Merge al Iniciar Sesión**: Si un usuario tiene gastos cargados localmente de forma anónima y decide crear o iniciar sesión en su cuenta, `syncAllWithCloud` sube automáticamente los gastos locales a la base de datos sin pérdida de información.

---

## 2. 🏛️ Arquitectura de Componentes

La aplicación opera como una Single Page Application (SPA) Mobile-First centrada con ancho máximo `max-w-md` en pantallas grandes.

### 2.1 Árbol de Componentes

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
│   └── FloatingActionButton (FAB [+] para abrir carga rápida)
├── AddExpenseSheet (BottomSheet modal para alta y edición)
│   └── ExpenseForm
├── AuthModal (BottomSheet para login, registro, auto-confirmación y cierre de sesión)
├── ExportPanel (Modal con vista previa para WhatsApp y descarga de CSV)
├── ConfirmDialog (Modal reutilizable para acciones destructivas)
└── Toaster (Contenedor de notificaciones flotantes reactivas)
```

### 2.2 Especificación y Responsabilidad de Componentes

| Componente | Archivo | Responsabilidad Única |
|---|---|---|
| `Layout` | `src/components/layout/Layout.tsx` | Contenedor principal centrado (`max-w-md mx-auto min-h-screen pb-24 relative bg-slate-50`). Asegura el área segura (safe-area) de dispositivos móviles. |
| `Header` | `src/components/layout/Header.tsx` | Muestra el isotipo y nombre de la app, el botón de estado de sincronización / autenticación y el acceso a `ExportPanel`. |
| `AuthModal` | `src/components/auth/AuthModal.tsx` | Modal de autenticación conmutador de SignIn/SignUp, visualización de usuario vinculado, forzado manual de sync y cierre de sesión. Sanitiza inputs automáticamente. |
| `PeriodFilter` | `src/components/dashboard/PeriodFilter.tsx` | Selector segmentado tipo píldora (`Este mes`, `Mes anterior`, `Todo el historial`). Controla el filtro activo en `useFilterStore`. |
| `SummaryCards` | `src/components/dashboard/SummaryCards.tsx` | Renderiza el bloque superior con las 3 tarjetas de métricas. Orquesta la sincronización con los cálculos de `utils/metrics.ts`. |
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

Esta tabla es la **ÚNICA fuente de verdad** para todos los textos visibles en la interfaz. La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`).

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

Las métricas se calculan de manera pura y predecible a partir del listado de gastos y del filtro de período seleccionado:

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

### 6.1 Formato WhatsApp (Texto Plano con Markdown)
Genera el desglose organizado con asteriscos para negritas compatibles con WhatsApp:
```text
📊 *Rendición de Gastos - DelaySpend*
🗓 *Período:* Septiembre 2026

💸 *Gastos Reales Realizados:*
• 11/09: Supermercado Coto - $14.500,00 [Supermercado]
• 09/09: Carga SUBE - $2.400,00 [Transporte]

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

### 6.2 Formato CSV (Excel / Google Sheets)
- **Codificación**: UTF-8 con BOM (`\uFEFF`) obligatorio para evitar caracteres rotos en Windows.
- **Escape RFC 4180**: Delimitado por comas con comillas de escape para descripciones con signos de puntuación.
- **Columnas**: `Fecha`, `Tipo`, `Monto`, `Categoría`, `Concepto / Detalle`, `Estado de Transferencia`, `Fecha de Transferencia`.

---

## 7. 📱 Reglas de Interfaz Mobile-First y Accesibilidad

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
