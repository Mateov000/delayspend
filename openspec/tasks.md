# DelaySpend — Plan de Tareas de Construcción (Tasks)

**Documento:** `openspec/tasks.md`  
**Versión:** 1.0.0 · **Estado:** Listo para ejecución  
**Metodología:** OpenSpec / ChangeSpec  
**Regla de Oro:** Se ejecuta estrictamente **una tarea a la vez**, en orden secuencial, esperando la confirmación explícita del usuario antes de comenzar la siguiente.

---

## 🚦 Leyenda de Estados
- `[ ]` Tarea pendiente
- `[x]` Tarea completada, probada y validada
- 🛑 **Punto de Control (Checkpoint)**: Pausa obligatoria. El agente de IA debe detenerse y pedir autorización al usuario antes de avanzar de Track.

---

## 📦 TRACK A: Estructura Base, Modelo de Datos & Formulario de Carga Mobile-First

*Objetivo del Track: Disponer del andamiaje funcional de la PWA, el store de datos base y el formulario táctil para registrar gastos reales y compras delayeadas con feedback visual.*

### Fase A.1: Inicialización de Proyecto y Tooling
- [ ] **A.1.1 — Crear proyecto con Vite y TypeScript**  
- [x] **A.1.1 — Crear proyecto con Vite y TypeScript**  
  - Crear estructura base en el directorio raíz con `npm create vite@latest . -- --template react-ts`.  
  - Limpiar archivos boilerplate innecesarios (`App.css`, assets de demo de Vite).  
  - *Criterio de validación*: `npm run dev` arranca en `http://localhost:5173/` sin errores de consola.

- [ ] **A.1.2 — Instalar dependencias esenciales de producción**  
- [x] **A.1.2 — Instalar dependencias esenciales de producción**  
  - Instalar: `zustand`, `lucide-react`.  
  - Instalar devDependencies: `@tailwindcss/vite`, `vite-plugin-pwa`.  
  - *Criterio de validación*: `package.json` contiene únicamente las dependencias autorizadas en `README.md`.

- [ ] **A.1.3 — Configurar Tailwind CSS v4**  
- [x] **A.1.3 — Configurar Tailwind CSS v4**  
  - Configurar plugin `@tailwindcss/vite` en `vite.config.ts`.  
  - Configurar `src/index.css` con `@import "tailwindcss";` y definir directivas de viewport y safe-areas.  
  - *Criterio de validación*: Clases utilitarias de Tailwind aplican estilos correctamente en un elemento de prueba.

- [ ] **A.1.4 — Configurar TypeScript en modo estricto exhaustivo**  
- [x] **A.1.4 — Configurar TypeScript en modo estricto exhaustivo**  
  - Ajustar `tsconfig.json` con `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `forceConsistentCasingInFileNames: true`.  
  - *Criterio de validación*: `npm run typecheck` pasa en verde con 0 errores.

---

### Fase A.2: Definición de Tipos y Constantes Centrales
- [ ] **A.2.1 — Definir contratos y tipos TypeScript (`src/store/types.ts`)**  
- [x] **A.2.1 — Definir contratos y tipos TypeScript (`src/store/types.ts`)**  
  - Crear `src/store/types.ts` con las interfaces: `ExpenseType`, `CategoryId`, `Category`, `Expense`, `PeriodFilterType`, `PeriodFilterState`, `FinancialMetrics`.  
  - *Criterio de validación*: Tipos exportados sin dependencias externas y coincidentes al 100% con `openspec/design.md`.

- [ ] **A.2.2 — Crear catálogo de categorías e iconografía (`src/constants/categories.ts`)**  
- [x] **A.2.2 — Crear catálogo de categorías e iconografía (`src/constants/categories.ts`)**  
  - Crear las 10 categorías oficiales con su identificador, nombre legible en español, nombre de icono Lucide y clases de color Tailwind.  
  - Exportar helper `getCategoryById(id: CategoryId): Category`.  
  - *Criterio de validación*: Todas las categorías resuelven un ícono y color válido.

- [ ] **A.2.3 — Crear tabla de strings con voseo (`src/constants/strings.ts`)**  
- [x] **A.2.3 — Crear tabla de strings con voseo (`src/constants/strings.ts`)**  
  - Implementar el objeto inmutable `STRINGS as const` conteniendo todos los textos exactos definidos en la Sección 3 de `openspec/design.md`.  
  - *Criterio de validación*: Cero strings huérfanos; todos los textos visibles de la app referencian esta constante.

---

### Fase A.3: Store de Zustand Base y Utilidades Primarias
- [ ] **A.3.1 — Crear utilidades de ID y formateo (`src/utils/id.ts`, `src/utils/format.ts`)**  
- [x] **A.3.1 — Crear utilidades de ID y formateo (`src/utils/id.ts`, `src/utils/format.ts`)**  
  - Crear `generateId()` en `src/utils/id.ts` usando `crypto.randomUUID()` con fallback seguro.  
  - Crear `formatCurrency(amount: number)` en `src/utils/format.ts` configurado para pesos argentinos (`Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`).  
  - Crear `formatDisplayDate(dateStr: string)` para fechas legibles ("Hoy", "Ayer", "11/09/2026").  
  - *Criterio de validación*: Tests manuales verifican `$ 1.250,50` y fechas correctas.

- [ ] **A.3.2 — Crear Store de Notificaciones Toast (`src/store/useToastStore.ts`)**  
- [x] **A.3.2 — Crear Store de Notificaciones Toast (`src/store/useToastStore.ts`)**  
  - Implementar store para manejar cola de toasts efímeros (`id`, `message`, `type: 'success' | 'info' | 'error'`).  
  - Agregar acción `showToast(message, type)` con auto-remoción a los 3000ms.  
  - *Criterio de validación*: Función invocable desde cualquier componente sin causar re-renders masivos.

- [ ] **A.3.3 — Crear Store Financiero en memoria (`src/store/useExpenseStore.ts`)**  
- [x] **A.3.3 — Crear Store Financiero en memoria (`src/store/useExpenseStore.ts`)**  
  - Implementar estado inicial `expenses: []`.  
  - Implementar acciones: `addExpense`, `updateExpense`, `deleteExpense`.  
  - Validar que `addExpense` garantice `amount > 0` y asigne `transferredAt: null`.  
  - *Criterio de validación*: Las acciones añaden, modifican y quitan elementos del array de forma inmutable.

---

### Fase A.4: Componentes UI Fundamentales (Mobile-First)
- [ ] **A.4.1 — Crear componentes Button, Card y Badge (`src/components/ui/`)**  
- [x] **A.4.1 — Crear componentes Button, Card y Badge (`src/components/ui/`)**  
  - Implementar `Button.tsx` con variantes: `primary`, `secondary`, `outline`, `ghost`, `destructive` y área táctil mínima de 44px.  
  - Implementar `Card.tsx` con bordes redondeados `rounded-2xl`, borde tenue y elevación sutil.  
  - Implementar `Badge.tsx` para indicar categorías y estados.  
  - *Criterio de validación*: Componentes visualmente consistentes y accesibles mediante teclado y touch.

- [ ] **A.4.2 — Crear componente Toaster (`src/components/ui/Toaster.tsx`)**  
- [x] **A.4.2 — Crear componente Toaster (`src/components/ui/Toaster.tsx`)**  
  - Renderizar contenedor flotante en la parte superior/inferior de la pantalla (`z-50`).  
  - Integrar con `useToastStore` para desplegar mensajes con animación suave.  
  - *Criterio de validación*: `showToast("Prueba")` despliega el cartel y desaparece solo tras 3 segundos.

- [ ] **A.4.3 — Crear componente BottomSheet modal (`src/components/ui/BottomSheet.tsx`)**  
- [x] **A.4.3 — Crear componente BottomSheet modal (`src/components/ui/BottomSheet.tsx`)**  
  - Crear contenedor modal deslizante desde abajo con overlay oscuro y `backdrop-blur`.  
  - Permitir cierre mediante botón (X), tap en backdrop o tecla Escape.  
  - Bloquear el scroll del `body` cuando el sheet esté abierto.  
  - *Criterio de validación*: El sheet se abre y cierra fluidamente en pantalla de 375px.

---

### Fase A.5: Formulario de Carga y Layout Base
- [ ] **A.5.1 — Crear Layout y Header (`src/components/layout/`)**  
- [x] **A.5.1 — Crear Layout y Header (`src/components/layout/`)**  
  - Implementar `Layout.tsx` con contenedor `max-w-md mx-auto min-h-screen pb-24 bg-slate-50`.  
  - Implementar `Header.tsx` con el isotipo de DelaySpend, título y botón para abrir rendición/exportación.  
  - *Criterio de validación*: La estructura se adapta y se mantiene centrada tanto en mobile como en desktop.

- [ ] **A.5.2 — Crear Floating Action Button (`src/components/form/FloatingActionButton.tsx`)**  
- [x] **A.5.2 — Crear Floating Action Button (`src/components/form/FloatingActionButton.tsx`)**  
  - Botón circular de 56x56px fijo en `bottom-6 right-6` con ícono `Plus` y feedback táctil (`active:scale-95`).  
  - *Criterio de validación*: Perfectamente accionable con el pulgar en una mano.

- [ ] **A.5.3 — Crear Formulario de Gasto / Delay (`src/components/form/ExpenseForm.tsx`)**  
- [x] **A.5.3 — Crear Formulario de Gasto / Delay (`src/components/form/ExpenseForm.tsx`)**  
  - Implementar segmented control para alternar entre "Gasto Real" y "Compra Delayeada".  
  - Implementar input numérico grande con prefijo `$` y `inputMode="decimal"`.  
  - Selector táctil de categoría en cuadrícula con íconos representativos.  
  - Input para concepto/detalle y selector de fecha con default en la fecha de hoy.  
  - Botón de submit con copy adaptativo: `Registrar gasto` vs `¡Delayear y guardar!`.  
  - *Criterio de validación*: Formulario usable íntegramente con una mano en 375px de ancho.

- [ ] **A.5.4 — Integrar AddExpenseSheet y notificaciones toast**  
- [x] **A.5.4 — Integrar AddExpenseSheet y notificaciones toast**  
  - Conectar `AddExpenseSheet.tsx` para orquestar `BottomSheet` y `ExpenseForm`.  
  - Al enviar: invocar `addExpense` del store, cerrar el sheet y disparar toast correspondiente (`TOAST_EXPENSE_ADDED_REAL` o `TOAST_EXPENSE_ADDED_DELAYED`).  
  - *Criterio de validación*: El gasto se guarda en el store y se muestra el toast con el copy exacto.

---

### 🛑 Checkpoint Track A
- [ ] **A.6.1 — Validación Integral de Track A**  
- [x] **A.6.1 — Validación Integral de Track A**  
  - Ejecutar `npm run typecheck` y `npm run lint`.  
  - Validar visualmente en viewport de 375px de ancho que no existan desbordes horizontales ni solapamientos.  
  - Probar carga de 1 gasto real y 1 gasto delayeado.  
  - **STOP OBLIGATORIO**: Solicitar confirmación y aprobación explícita del usuario para iniciar el Track B.

---

## 📊 TRACK B: Dashboard, Métricas Conductuales & Historial Interactivo

*Objetivo del Track: Visualizar el impacto del ahorro mediante las tarjetas de cálculo dinámico, destacar la métrica estrella ("Monto a transferir"), proveer la acción rápida de transferencia e implementar el historial agrupado por fechas.*

### Fase B.1: Utilidades de Cálculo y Fechas
- [ ] **B.1.1 — Crear utilidades de fechas relativas y períodos (`src/utils/date.ts`)**  
- [x] **B.1.1 — Crear utilidades de fechas relativas y períodos (`src/utils/date.ts`)**  
  - Implementar `isWithinPeriod(dateStr: string, filter: PeriodFilterState): boolean`.  
  - Implementar `groupExpensesByDate(expenses: Expense[]): Map<string, Expense[]>`.  
  - Implementar etiquetas legibles de cabecera: "Hoy", "Ayer", o fecha formateada en español.  
  - *Criterio de validación*: Gastos de diferentes días y meses se filtran y agrupan sin errores de zona horaria.

- [ ] **B.1.2 — Implementar cálculo de métricas financieras (`src/utils/metrics.ts`)**  
- [x] **B.1.2 — Implementar cálculo de métricas financieras (`src/utils/metrics.ts`)**  
  - Implementar función pura `calculateMetrics(expenses, filter)` según la Sección 5 de `openspec/design.md`.  
  - Calcular: `totalReal`, `totalDelayed`, `pendingTransfer`, `totalTransferred`, `totalAccounted` y `delayRatePercentage`.  
  - *Criterio de validación*: Sumatorias exactas con gastos reales, delayeados transferidos y pendientes.

---

### Fase B.2: SummaryCards y la Métrica Estrella
- [ ] **B.2.1 — Crear componente MetricCard (`src/components/dashboard/MetricCard.tsx`)**  
- [x] **B.2.1 — Crear componente MetricCard (`src/components/dashboard/MetricCard.tsx`)**  
  - Tarjeta de métrica con título, monto en tipografía destacada, subtítulo contextual e icono temático.  
  - Variantes de color: Real (Rojo/Rose), Delayeado (Esmeralda/Verde).  
  - *Criterio de validación*: Montos formateados con `formatCurrency`.

- [ ] **B.2.2 — Crear TransferActionCard (Métrica Estrella) (`src/components/dashboard/TransferActionCard.tsx`)**  
- [x] **B.2.2 — Crear TransferActionCard (Métrica Estrella) (`src/components/dashboard/TransferActionCard.tsx`)**  
  - Diseñar tarjeta destacada para `Monto a Transferir`.  
  - Si `pendingTransfer > 0`: Desplegar monto en color llamativo y botón de acción principal `[ Ya lo transferí ]`.  
  - Si `pendingTransfer === 0`: Mostrar estado de éxito conductual `¡Estás al día con tu ahorro! 🚀` con badge verde.  
  - *Criterio de validación*: El botón solo se muestra cuando hay plata pendiente de transferir.

- [ ] **B.2.3 — Implementar acción de transferencia masiva en el store (`useExpenseStore.ts`)**  
- [x] **B.2.3 — Implementar acción de transferencia masiva en el store (`useExpenseStore.ts`)**  
  - Implementar acción `markAllPendingAsTransferred()` que actualiza `transferredAt` a la fecha actual para todos los delayeados pendientes.  
  - Conectar el botón `[ Ya lo transferí ]` a esta acción, abriendo `ConfirmDialog` previo.  
  - Al confirmar: disparar `TOAST_TRANSFERRED_ALL_SUCCESS` y verificar que el monto baje automáticamente a `$0`.  
  - *Criterio de validación*: La métrica estrella pasa a $0 inmediatamente al confirmar la transferencia.

- [ ] **B.2.4 — Ensamblar SummaryCards (`src/components/dashboard/SummaryCards.tsx`)**  
- [x] **B.2.4 — Ensamblar SummaryCards (`src/components/dashboard/SummaryCards.tsx`)**  
  - Componer el grid con las 3 tarjetas superiores: Total Gastado, Total Guardado y TransferActionCard.  
  - *Criterio de validación*: Visualmente balanceado en 375px (cards apiladas verticalmente o grid 2x1 responsivo).

---

### Fase B.3: Historial Cronológico y Tarjeta de Gasto
- [ ] **B.3.1 — Crear componente EmptyState (`src/components/ui/EmptyState.tsx`)**  
- [x] **B.3.1 — Crear componente EmptyState (`src/components/ui/EmptyState.tsx`)**  
  - Mensaje ilustrado con ícono amigable y copy motivacional de `STRINGS.HISTORY_EMPTY_*`.  
  - *Criterio de validación*: Se visualiza correctamente cuando no hay registros en la lista.

- [ ] **B.3.2 — Crear ítem de historial (`src/components/history/ExpenseListItem.tsx`)**  
- [x] **B.3.2 — Crear ítem de historial (`src/components/history/ExpenseListItem.tsx`)**  
  - Renderizar fila con: ícono de categoría con su color distintivo, descripción/concepto, fecha legible, monto con signo correspondiente.  
  - Badge de estado: `Gasto` (rojo) o `Delayeado` (verde).  
  - Indicador de transferencia para delayeados: badge `Ahorro transferido` con tilde verde si `transferredAt !== null`, o `Pendiente transferir` si es `null`.  
  - Botón de menú o acciones para Editar y Eliminar.  
  - *Criterio de validación*: Información completa y legible en 375px sin solapamiento de textos.

- [ ] **B.3.3 — Crear agrupador por fecha (`src/components/history/ExpenseHistoryGroup.tsx`)**  
- [x] **B.3.3 — Crear agrupador por fecha (`src/components/history/ExpenseHistoryGroup.tsx`)**  
  - Cabecera de fecha ("Hoy", "Ayer", "Miércoles 10 de Septiembre") con subtotal neto gastado/delayeado del día.  
  - Renderizado de la lista de `ExpenseListItem` pertenecientes al grupo.  
  - *Criterio de validación*: Agrupación cronológica descendente precisa.

- [ ] **B.3.4 — Crear contenedor ExpenseHistory (`src/components/history/ExpenseHistory.tsx`)**  
- [x] **B.3.4 — Crear contenedor ExpenseHistory (`src/components/history/ExpenseHistory.tsx`)**  
  - Obtener gastos del store, ordenarlos descendentemente por fecha y renderizar los grupos o el `EmptyState`.  
  - *Criterio de validación*: Lista con scroll natural e integración fluida en la vista principal.

---

### Fase B.4: Ciclo de Vida del Gasto (Edición y Eliminación Segura)
- [ ] **B.4.1 — Crear componente ConfirmDialog accesible (`src/components/ui/ConfirmDialog.tsx`)**  
- [x] **B.4.1 — Crear componente ConfirmDialog accesible (`src/components/ui/ConfirmDialog.tsx`)**  
  - Modal accesible con título, mensaje explicativo, botón de acción destructiva y botón de cancelar.  
  - Totalmente libre de `window.confirm`.  
  - *Criterio de validación*: Cumple con la regla de oro #6 de interfaz; accesible vía teclado (Esc).

- [ ] **B.4.2 — Implementar flujo de eliminación de gasto**  
- [x] **B.4.2 — Implementar flujo de eliminación de gasto**  
  - Conectar botón "Eliminar" de `ExpenseListItem` para abrir `ConfirmDialog` con los textos de `STRINGS.CONFIRM_DELETE_*`.  
  - Al confirmar: ejecutar `deleteExpense(id)` y disparar `TOAST_EXPENSE_DELETED`.  
  - *Criterio de validación*: El gasto desaparece de la lista y las métricas del dashboard se recalculan al instante.

- [ ] **B.4.3 — Implementar flujo de edición de gasto**  
- [x] **B.4.3 — Implementar flujo de edición de gasto**  
  - Permitir que `ExpenseListItem` abra `AddExpenseSheet` en modo edición, precargando los campos del gasto seleccionado.  
  - Al guardar: invocar `updateExpense(id, data)` y disparar `TOAST_EXPENSE_UPDATED`.  
  - *Criterio de validación*: Se actualizan monto, categoría, tipo y concepto sin perder el `id` ni alterar `createdAt`.

- [ ] **B.4.4 — Implementar toggle individual de transferencia**  
- [x] **B.4.4 — Implementar toggle individual de transferencia**  
  - Acción individual en cada ítem delayeado para marcar/desmarcar transferencia (`toggleTransferred(id)`).  
  - *Criterio de validación*: Permite corregir errores puntuales sin forzar transferir todos los ítems.

---

### 🛑 Checkpoint Track B
- [ ] **B.5.1 — Validación Integral de Track B**  
- [x] **B.5.1 — Validación Integral de Track B**  
  - Ejecutar `npm run typecheck` y `npm run lint`.  
  - Cargar 3 gastos (1 real de $5.000, 1 delayeado de $10.000, 1 delayeado de $2.000).  
  - Verificar que "Total Gastado" sea $5.000, "Total Guardado" sea $12.000, y "Monto a Transferir" sea $12.000.  
  - Tocar "Ya lo transferí" -> confirmar en `ConfirmDialog` -> verificar que baje a $0 y muestre felicitación.  
  - **STOP OBLIGATORIO**: Solicitar confirmación y aprobación explícita del usuario para iniciar el Track C.

---

## 💾 TRACK C: Persistencia, Rendición de Cuentas & PWA Offline

*Objetivo del Track: Garantizar que ningún dato se pierda mediante persistencia en localStorage, implementar el filtrado por períodos, construir el panel de exportación a WhatsApp/CSV para los padres y convertir la app en una PWA offline-first instalable.*

### Fase C.1: Persistencia LocalStorage y Resiliencia
- [x] **C.1.1 — Configurar middleware persist en Zustand (`src/store/useExpenseStore.ts`)**  
  - Integrar `persist` con storage `localStorage` y nombre de clave `delayspend_storage_v1`.  
  - *Criterio de validación*: Tras cargar gastos y presionar F5 (recarga forzada), todos los datos y estados permanecen intactos.

- [x] **C.1.2 — Implementar sanitización y migración de datos al rehidratar**  
  - Validar tipos y campos obligatorios durante la rehidratación para prevenir caídas de app si el storage contiene JSON corrupto.  
  - *Criterio de validación*: Si se inserta un registro inválido a mano en DevTools, la app no crashea y sanea la lista.

---

### Fase C.2: Filtrado por Período
- [x] **C.2.1 — Crear Store de Filtros (`src/store/useFilterStore.ts`)**  
  - Crear store con `activeFilter: { type: 'current_month' }` y acción `setFilter(type)`.  
  - Opciones: `current_month` ("Este mes"), `previous_month` ("Mes anterior"), `all` ("Todo el historial").  
  - *Criterio de validación*: El filtro activo se preserva y notifica a los suscriptores.

- [x] **C.2.2 — Crear componente PeriodFilter (`src/components/dashboard/PeriodFilter.tsx`)**  
  - Barra de píldoras segmentadas con estilos visuales activos/inactivos de alto contraste.  
  - Totalmente operable con toques rápidos en pantalla de 375px.  
  - *Criterio de validación*: Cambiar de píldora actualiza de forma reactiva tanto las `SummaryCards` como el `ExpenseHistory`.

---

### Fase C.3: Módulo de Rendición de Cuentas y Exportación
- [x] **C.3.1 — Crear generador de reporte para WhatsApp (`src/utils/export.ts`)**  
  - Implementar función `generateWhatsAppReport(expenses, filter, metrics): string` con el formato exacto de la Sección 6.1 de `openspec/design.md`.  
  - Incluir fecha, lista de gastos reales, lista de delayeados con su estado (transferido o pendiente), y resumen financiero.  
  - *Criterio de validación*: El texto generado se lee nítido y usa negritas `*` compatibles con WhatsApp.

- [x] **C.3.2 — Crear generador y descargador de CSV (`src/utils/export.ts`)**  
  - Implementar función `downloadExpensesCSV(expenses, filter): void`.  
  - Incluir cabeceras en español y UTF-8 BOM (`\uFEFF`) obligatorio para compatibilidad total con Microsoft Excel en Windows.  
  - Escapar valores con comillas para soportar comas en las descripciones.  
  - *Criterio de validación*: El archivo `.csv` descargado abre directamente en Excel sin caracteres rotos ni columnas desplazadas.

- [x] **C.3.3 — Crear componente ExportPanel (`src/components/export/ExportPanel.tsx`)**  
  - Modal accesible con dos pestañas: "Para WhatsApp" y "Archivo CSV (Excel)".  
  - Pestaña WhatsApp: Vista previa del texto en recuadro monospace/estilizado y botón `[ Copiar reporte para WhatsApp ]` que usa la API `navigator.clipboard` y dispara `TOAST_COPIED_TO_CLIPBOARD`.  
  - Pestaña CSV: Detalle de exportación y botón `[ Descargar reporte (.csv) ]` que genera la descarga y dispara `TOAST_CSV_DOWNLOADED`.  
  - Conectar apertura desde el botón `Header`.  
  - *Criterio de validación*: Copiado en 1 tap funcional; archivo CSV generado y descargado al instante.

---

### Fase C.4: Configuración PWA Offline-First
- [x] **C.4.1 — Configurar manifest web (`public/manifest.webmanifest`)**  
  - Declarar nombre de app ("DelaySpend"), nombre corto, descripción, color de tema (`#0f172a`), color de fondo (`#f8fafc`), display `standalone`, orientación `portrait`.  
  - *Criterio de validación*: Chrome DevTools > Application > Manifest reconoce la metadata sin advertencias.

- [x] **C.4.2 — Configurar iconos de PWA (`public/icons/`)**  
  - Generar y ubicar iconos adaptativos en resoluciones 192x192 y 512x512 px con propósito `maskable` y `any`.  
  - Vincular en `index.html` mediante tags `<link rel="manifest">` y `<link rel="icon">`.  
  - *Criterio de validación*: Iconos visibles en el inspector de PWA de DevTools.

- [x] **C.4.3 — Configurar vite-plugin-pwa y Service Worker (`vite.config.ts`)**  
  - Configurar `VitePWA` con registro automático y cacheo de HTML, CSS, JS e iconos.  
  - *Criterio de validación*: En DevTools pestaña Application > Service Workers figura "Activated and is running". Poner DevTools en modo "Offline" y recargar: la app funciona al 100%.

---

### Fase C.5: Auditoría Final, Criterios de Aceptación y Release v1.0.0
- [x] **C.5.1 — Verificación estricta de tipos y linteo**  
  - Correr `npm run typecheck` y validar 0 errores de TypeScript estricto.  
  - Correr `npm run lint` y verificar 0 advertencias o errores.  
  - Confirmar ausencia de `any` no justificado y ausencia total de `window.confirm`.  
  - *Criterio de validación*: Salida limpia de ambos comandos en consola.

- [x] **C.5.2 — Verificación de build de producción**  
  - Ejecutar `npm run build` y comprobar generación limpia en `dist/`.  
  - Probar ejecución mediante `npm run preview`.  
  - *Criterio de validación*: Build completado sin warnings y ejecutable localmente.

- [x] **C.5.3 — Auditoría manual de los 10 criterios de aceptación globales ("Done when")**  
  - Validar cada uno de los 10 checkboxes de `README.md` comprobando: persistencia, resiliencia offline, métrica estrella a $0, exportación WhatsApp/CSV, diseño operable en 375px y textos exactos en español.  
  - *Criterio de validación*: Todos los criterios de aceptación cumplidos al 100%.

---

### 🛑 Checkpoint Final Track C
- [x] **C.5.4 — Cierre y Entrega de Release v1.0.0**  
  - **PROYECTO COMPLETO**: Presentar reporte de release al usuario indicando el cumplimiento de todas las tareas y especificaciones.

