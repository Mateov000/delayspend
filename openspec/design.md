# DelaySpend — Diseño Técnico y Especificación de Dominio

**Documento:** `openspec/design.md`  
**Versión:** 1.0.0 · **Estado:** Aprobado para construcción  
**Metodología:** OpenSpec / ChangeSpec  

---

## 1. 📐 Modelo de Datos y Contrato del Store (Zustand)

Todo el estado financiero se gestiona mediante un único store de Zustand (`useExpenseStore`), tipado de forma estricta y persistido automáticamente en `localStorage` con la clave `delayspend_storage_v1`.

### 1.1 Tipos de Dominio (`src/store/types.ts`)

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
```

### 1.2 Interfaz del Store Financiero (`src/store/useExpenseStore.ts`)

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
  
  // Mantenimiento
  resetAllData: () => void;
  importExpenses: (expenses: Expense[]) => void;
}
```

### 1.3 Reglas de Negocio del Store

1. **Inmutabilidad estricta**: Ninguna acción muta el array `expenses` in-place; siempre se retornan nuevas copias vía spread o `filter`/`map`.
2. **Validación de Monto**: `amount` debe ser un número finito estrictamente mayor a `0`.
3. **Mecánica de `transferredAt`**:
   - Para gastos reales (`type === 'real'`), `transferredAt` siempre debe ser `null`.
   - Para compras delayeadas (`type === 'delayed'`), nace con `transferredAt: null`.
   - Al ejecutar `markAllPendingAsTransferred()`, todos los gastos con `type === 'delayed' && transferredAt === null` actualizan su `transferredAt` con el timestamp `new Date().toISOString()`.
   - `toggleTransferred(id)` permite conmutar el estado si el usuario se equivocó o transfirió manualmente solo ese ítem.
4. **Persistencia y Sanitización**: El middleware `persist` de Zustand serializa el array `expenses`. Al rehidratar, si alguna fecha o campo numérico viene corrupto, se descarta o repara sin romper la app.

---

## 2. 🏛️ Arquitectura de Componentes

La aplicación está diseñada para operar como una Single Page Application (SPA) Mobile-First contenida en un marco responsivo centrado (ancho máximo `max-w-md` en pantallas grandes).

### 2.1 Árbol de Componentes

```
App
├── Layout
│   ├── Header
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
│       ├── TypeSelector (Toggle Gasto Real vs Compra Delayeada)
│       ├── AmountInput (Display numérico gigante con inputMode decimal)
│       ├── CategorySelector (Grid táctil con íconos)
│       ├── DescriptionInput (Concepto)
│       └── DateInput (Selector de fecha)
├── ExportPanel (Modal con vista previa para WhatsApp y descarga de CSV)
├── ConfirmDialog (Modal reutilizable para acciones destructivas)
└── Toaster (Contenedor de notificaciones flotantes reactivas)
```

### 2.2 Especificación y Responsabilidad de Componentes

| Componente | Archivo | Responsabilidad Única |
|---|---|---|
| `Layout` | `src/components/layout/Layout.tsx` | Contenedor principal centrado (`max-w-md mx-auto min-h-screen pb-24 relative bg-slate-50`). Asegura el área segura (safe-area) de dispositivos móviles. |
| `Header` | `src/components/layout/Header.tsx` | Muestra el isotipo y nombre de la app, el tagline conductual breve y el botón de acceso directo a `ExportPanel`. |
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

---

## 3. 💬 Tabla de Exact Spanish Strings (`src/constants/strings.ts`)

Esta tabla es la **ÚNICA fuente de verdad** para todos los textos visibles en la interfaz. La app utiliza un tono argentino/latinoamericano natural, empático y con voseo (`anotá`, `guardá`, `transferí`, `querés`). Queda terminantemente prohibido inventar textos inline en los componentes.

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
} as const;
```

---

## 4. 🏷️ Categorías e Iconografía (`src/constants/categories.ts`)

Cada categoría cuenta con un identificador único, etiqueta en español, icono de `lucide-react` y colores visuales asociados:

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

El módulo de exportación soporta dos canales de rendición:

### 6.1 Formato WhatsApp (Texto Plano con Markdown Nativo)
El texto generado no requiere edición manual y se estructura así:

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

---

## 7. 📱 Reglas de Interfaz Mobile-First y Accesibilidad

1. **Diseño para 375px**: Todo elemento, padding y botón debe lucir perfecto en pantallas de 375px de ancho (iPhone SE).
2. **Keypad Numérico**: El campo de monto utiliza `<input type="text" inputMode="decimal" pattern="[0-9]*" />` para forzar la apertura del teclado numérico grande en iOS y Android.
3. **Touch Targets**: Botones, selectores y tarjetas interactivas cuentan con una altura mínima de `44px` para garantizar la operabilidad con una sola mano.
4. **Animaciones Fluidas**: Despliegue de modales y toasts con transiciones CSS nativas ligeras (`transition-all duration-200 ease-out`).
5. **No confirmaciones nativas**: Prohibido `window.confirm`, `window.alert` o `window.prompt`. Se utiliza `ConfirmDialog` y `Toaster`.

