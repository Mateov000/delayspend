# DelaySpend

> Cada gasto que evitás vale tanto como cada peso que gastás. DelaySpend lo registra, lo mide, y te dice exactamente cuánto mover a tu cuenta de ahorro.

**Tipo de proyecto:** PWA de finanzas personales basada en economía conductual  
**Arquitectura:** Local-First Híbrida — PWA Offline-First con Backend en la Nube (Supabase PostgreSQL, Auth con triggers, Realtime WebSockets) y Hosting Edge en Vercel  
**Metodología de desarrollo:** Spec-Driven (OpenSpec / ChangeSpec)  
**Versión actual:** 1.5.0 · **Última actualización:** Septiembre 2026  

---

## 🌐 Enlaces del Proyecto en Producción

- 🚀 **App en Vivo (Producción):** [https://delayspend.vercel.app](https://delayspend.vercel.app)
- 🐙 **Repositorio en GitHub:** [https://github.com/Mateov000/delayspend](https://github.com/Mateov000/delayspend)
- 🗄️ **Panel de Supabase (Backend):** [https://supabase.com/dashboard/project/zbbsxhwrvzxznfqcmtaw](https://supabase.com/dashboard/project/zbbsxhwrvzxznfqcmtaw)
- 📖 **Manual de Uso Completo:** [`openspec/manual_de_uso.md`](openspec/manual_de_uso.md)
- 📐 **Especificación Técnica de Dominio:** [`openspec/design.md`](openspec/design.md)
- 🔄 **Especificación del Sync Engine:** [`openspec/sync_spec.md`](openspec/sync_spec.md)

---

## 🎯 Filosofía y Propósito

DelaySpend parte de una premisa de economía conductual: la fricción de "anotar que estuviste a punto de gastar" alcanza para frenar compras impulsivas, y esa plata que decidiste no gastar merece un destino concreto en lugar de diluirse en tu cuenta corriente de todos los días.

La app gestiona tres tipos de eventos:
- **Gasto real (`real`)**: Plata que efectivamente salió de tu bolsillo.
- **Gasto postergado (`delayed`)**: Una compra que ibas a hacer y frenaste. Alimenta el contador estrella *"Monto a transferir"*, indicándote exactamente cuánto dinero apartar a tu cuenta de ahorro remunerada.
- **Ingreso asignado (`income`)**: Dinero recibido para financiar el ciclo (transferencia de padres, sueldo o extras).

### Caso de Uso Central: Rendición de Cuentas Familiar sin Fricciones
Diseñada especialmente para jóvenes y estudiantes a quienes sus padres les transfieren dinero por etapas (quincenales, mensuales o a demanda):
- **Cero menciones a "DelaySpend":** Todos los reportes de WhatsApp y CSV generados para los padres tienen título formal (`📊 Rendición de Gastos`), sin revelar que la app trackea compras postergadas.
- **Privacidad y Censura Selectiva:** Rubros personales legítimos (como *Estética* para corte de pelo o tratamientos capilares) pueden enmascararse para mostrarse como *"Otros Gastos"*, manteniendo el total transferido y rendido exacto al centavo.
- **Aislamiento de Compras para la Casa:** Compras familiares (ej: verdulería o artículos del hogar) se rotulan como `[🏠 Para la casa]` y no ensucian el promedio de gasto diario corriente del usuario.

---

## ✨ Características Principales (v1.5.0)

1. **Ciclos y Períodos Financieros:** Permite iniciar ciclos cuando recibís dinero, fijar cortes por fecha o por un gasto específico, y revertir cortes (*undo*) sin perder ningún dato.
2. **Ahorro por Opción Más Barata:** Registrá el sobreprecio que evitaste al optar por una alternativa más económica; la app lo premia generando un crédito de ahorro a transferir.
3. **Las 4 Naturalezas de Gasto:** Clasificación entre *Cotidianos* (`daily`), *Fijos* (`fixed`), *Eventuales* (`eventual`) y *Para la casa* (`house`). Solo los cotidianos afectan el ritmo diario corriente.
4. **Metas Multitemporales:** Seguimiento de presupuesto por Ciclo, Mes calendario, Semana (lunes a domingo) o período Personalizado en N días, con límites globales y por categoría.
5. **Ritmo Diario Corriente Proyectado:** Muestra en paralelo tu gasto diario real y a cuánto se hubiera ido si hubieses concretado los impulsos delayeados.
6. **Ahorro Acumulado Estricto de Ciclos Cerrados:** Audita con rigor contable únicamente los períodos concluidos, sumando compras evitadas y sobrantes de ingresos efectivos.
7. **Analíticas con Filtro de Naturalezas:** Gráfico de dona con selector interactivo de naturalezas (botones *"Todas"* y *"Solo corrientes"*).
8. **Exportación Personalizada (Tuerquita ⚙️):** Menú interactivo para configurar qué naturalezas incluir, mostrar u ocultar categorías, mostrar u ocultar tags de naturaleza y elegir entre resumen completo o solo el total final. Las preferencias se guardan en el navegador.
9. **Sincronización Local-First Multi-Dispositivo:** Carga instantánea en 0ms y replicación por WebSockets entre celular y computadora en menos de 1 segundo.
10. **Auto-Confirmación de Cuentas:** Registro ágil mediante trigger PostgreSQL sin límites de cuotas de email de confirmación.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Rol / Notas |
|---|---|---|
| Framework | **React 19** | SPA pura, componentes táctiles accesibles |
| Build Tool | **Vite** | Template `react-ts` con HMR y bundle optimizado |
| Lenguaje | **TypeScript** | Modo estricto exhaustivo (`strict: true`), prohibido `any` |
| Estilos | **Tailwind CSS v4** | Approach CSS-first con `@tailwindcss/vite` |
| Estado Local | **Zustand** | Stores especializados con middleware `persist` (`localStorage`) |
| Base de Datos | **Supabase (PostgreSQL)** | Clúster en São Paulo (`sa-east-1`), RLS y checks de integridad |
| Autenticación | **Supabase Auth** | Sesiones JWT con trigger PL/pgSQL de auto-confirmación |
| Tiempo Real | **Supabase Realtime** | Replicación por WebSockets (`postgres_changes`) |
| Sincronización | **Custom Sync Engine** | Sincronización Local-First, cola offline y resolución LWW |
| Hosting & Edge | **Vercel** | Edge Network global, HTTPS obligatorio y rewrites SPA |
| PWA | **vite-plugin-pwa** | Service Worker y Web App Manifest instalable offline |
| Iconografía | **Lucide React** | Iconos visuales adaptados a cada rubro financiero |

---

## 🤖 Instrucciones para Agentes de IA (LEER ANTES DE MODIFICAR CÓDIGO)

Si sos un agente de IA (Claude, Cursor, Antigravity, Copilot u otro) operando en este repositorio, las siguientes directivas son inmutables:

### Orden de Lectura Obligatorio
1. **`README.md`** (este archivo): Visión general, stack y arquitectura.
2. **`openspec/manual_de_uso.md`**: Explicación funcional y operativa de cada módulo.
3. **`openspec/design.md`**: Contrato estricto de tipos TypeScript, fórmulas y esquemas PostgreSQL.
4. **`openspec/sync_spec.md`**: Mecanismos del motor de sincronización.
5. **`openspec/tasks.md`**: Plan de tareas y registro histórico.

### Reglas de Oro
1. **Arquitectura Local-First sagrada:** Toda mutación escribe inmediatamente en el store local (0ms). Las operaciones con Supabase ocurren de forma asíncrona mediante listeners desacoplados sin bloquear la UI.
2. **TypeScript estricto real:** Cero tipos `any` implícitos o explícitos salvo justificación con `// justificación: ...`.
3. **El copy no se improvisa:** Los textos visibles provienen de `src/constants/strings.ts` con voseo rioplatense.
4. **No usar diálogos nativos:** `window.confirm`, `window.alert` y `window.prompt` están prohibidos; usar `ConfirmDialog` y `Toaster`.
5. **Rendición a padres sin DelaySpend:** Toda exportación para padres debe mantener 0 menciones al término "DelaySpend".
6. **Mobile-First de 375px:** Toda vista o componente nuevo debe ser 100% operable con una sola mano en pantallas móviles antes de adaptarse a escritorio.

---

## ⚙️ Comandos de Desarrollo

```bash
npm install          # Instala dependencias del proyecto
npm run dev          # Servidor de desarrollo local con Vite (http://localhost:5173)
npm run build        # Verificación estricta de tipos TypeScript y build de producción
npm run preview      # Previsualización local del build empaquetado
npx vercel --prod    # Despliegue directo a producción en Vercel
```

---

## 🗺️ Mapa del Repositorio

```text
delayspend/
├── README.md                      # Entrada principal del proyecto
├── openspec/
│   ├── manual_de_uso.md           # Manual de uso y guía operativa detallada
│   ├── design.md                  # Especificación técnica, contratos y esquema DDL
│   ├── sync_spec.md               # Especificación del Sync Engine y Realtime
│   └── tasks.md                   # Registro histórico de tareas ejecutadas
├── supabase/
│   └── migrations/
│       ├── 20260911000000_create_expenses.sql     # Tabla expenses, RLS y Realtime
│       └── 20260911000001_auto_confirm_users.sql  # Trigger auto-confirmación
├── public/
│   ├── manifest.webmanifest       # Manifiesto PWA
│   └── icons/                     # Íconos de aplicación
├── src/
│   ├── App.tsx                    # Componente raíz y navegación por vistas
│   ├── main.tsx                   # Punto de entrada Vite
│   ├── index.css                  # Tailwind CSS v4 y directivas safe-area
│   ├── lib/
│   │   └── supabase.ts            # Cliente Supabase tipado
│   ├── components/
│   │   ├── auth/                  # AuthModal (Inicio de sesión y registro)
│   │   ├── layout/                # Header (con badge de sync) y Layout
│   │   ├── dashboard/             # SummaryCards, PeriodSummaryCard, PeriodFilter
│   │   ├── history/               # ExpenseHistory, ExpenseListItem, corte por gasto
│   │   ├── form/                  # AddExpenseSheet, ExpenseForm, FloatingActionButton
│   │   ├── analytics/             # HistoricalSavingsCard, BudgetGoalsCard, CategoryDonutChart
│   │   ├── settings/              # BudgetSettings (metas, categorías, privacidad padres)
│   │   ├── export/                # ExportPanel (reporte WhatsApp y CSV con tuerquita ⚙️)
│   │   └── ui/                    # Button, Card, BottomSheet, ConfirmDialog, Badge, Toaster
│   ├── store/
│   │   ├── types.ts               # Contratos de dominio
│   │   ├── useExpenseStore.ts     # Store de movimientos financieros
│   │   ├── usePeriodStore.ts      # Store de ciclos y cortes
│   │   ├── useBudgetStore.ts      # Store de presupuestos y metas multitemporales
│   │   ├── useCategoryStore.ts    # Store de categorías y privacidad parental
│   │   ├── useFilterStore.ts      # Store de filtro activo
│   │   ├── useToastStore.ts       # Store de notificaciones efímeras
│   │   ├── useAuthStore.ts        # Store de sesión Supabase
│   │   └── useSyncStore.ts        # Motor de sincronización en tiempo real
│   ├── utils/
│   │   ├── metrics.ts             # Fórmulas financieras base
│   │   ├── budgetMetrics.ts       # Cálculos de ritmo diario y metas
│   │   ├── historicalSavings.ts   # Ahorro acumulado de períodos cerrados
│   │   ├── export.ts              # Generación de reportes WhatsApp y CSV
│   │   ├── format.ts              # Moneda argentina ($ ARS) y fechas
│   │   ├── date.ts                # Filtrado temporal y pertenencia a ciclo
│   │   └── id.ts                  # Generación de UUIDs
│   └── constants/
│       ├── categories.ts          # Catálogo de rubros nativos
│       └── strings.ts             # ÚNICA fuente de verdad del copy con voseo
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

---
*DelaySpend v1.5.0 — Creado con economía conductual para cuidar cada peso.*
