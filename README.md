# DelaySpend

> Cada gasto que evitás vale tanto como cada peso que gastás. DelaySpend lo registra, lo mide, y te dice exactamente cuánto mover a tu cuenta de ahorro.

**Tipo de proyecto:** PWA de finanzas personales basada en psicología conductual  
**Arquitectura:** 100% cliente — sin backend, sin base de datos, sin autenticación  
**Arquitectura:** Local-First / Híbrida — PWA Offline-First con Backend en la Nube (Supabase PostgreSQL, Auth con triggers, Realtime WebSockets) y Hosting en Vercel  
**Metodología de desarrollo:** Spec-driven, inspirada en OpenSpec/ChangeSpec  
**Versión de este documento:** 1.0.0 · **Última actualización:** 2026-09-11
**Versión de este documento:** 1.4.0 · **Última actualización:** 2026-09-15  

---

## 🌐 Enlaces del Proyecto en Producción

- 🚀 **App en Vivo (Producción):** [https://delayspend.vercel.app](https://delayspend.vercel.app)
- 🐙 **Repositorio en GitHub:** [https://github.com/Mateov000/delayspend](https://github.com/Mateov000/delayspend)
- 🗄️ **Panel de Supabase (Backend):** [https://supabase.com/dashboard/project/zbbsxhwrvzxznfqcmtaw](https://supabase.com/dashboard/project/zbbsxhwrvzxznfqcmtaw)

---

## 🎯 Filosofía del Proyecto

DelaySpend parte de una idea simple de economía conductual: la fricción de "anotar que estuviste a punto de gastar" alcanza para cambiar el hábito, y esa plata que no gastaste merece un destino concreto, no diluirse en la cuenta de todos los días.

La app trackea dos tipos de eventos:

- **Gasto real**: plata que efectivamente salió de tu bolsillo.
- **Gasto delayeado**: una compra que ibas a hacer y decidiste postergar (o directamente no hacer). Ese monto **no se gastó**, pero tampoco debería "perderse" en la cuenta corriente: DelaySpend calcula exactamente cuánto de esa plata tenés que mover a una cuenta remunerada o de ahorro.

Como caso de uso principal (aunque no excluyente), está pensada para alguien a quien sus padres le financian los gastos del mes: la app funciona como herramienta de **rendición de cuentas transparente**, generando un resumen prolijo y exportable para mandar por WhatsApp o mail, sin necesidad de mostrar el resto de la cuenta bancaria. Además, cuenta con un **modo de rendición unificada** para presentar todos los montos como gastos comunes y justificar directamente la transferencia de dinero.

### Ciclos de Período, Reinicio de Contadores, Corte por Gasto y Ahorro por Opción Más Barata (v1.4.0)
Para ajustarse a la dinámica real de transferencias quincenales o mensuales:
- **Reinicio de Contadores**: Permite cerrar el ciclo actual y empezar uno nuevo con contadores en $0, manteniendo todo el historial previo navegable y editable.
- **Corte por Gasto Específico**: Permite fijar el inicio de un nuevo período a partir de un gasto específico (desde el formulario de nuevo período o desde el menú *"Iniciar nuevo período acá"* de cualquier movimiento). Ese gasto y todos los posteriores pasan al nuevo ciclo, con soporte total para deshacer el corte.
- **Ahorro Extra DelaySpend por Opción Más Barata**: Al registrar un gasto real, se puede anotar el sobreprecio evitado por elegir una alternativa más económica. El sistema genera automáticamente un registro delayeado complementario y alimenta la métrica estrella *"Monto a Transferir"*.
- **Ingreso Inicial / Presupuesto**: Permite registrar el dinero recibido para el período (ej. $50.000). La app calcula en tiempo real el saldo remanente (`Ingreso - Gastado Real`) y el saldo libre para ahorro.
- **Corte Deshacible (Undo)**: Cualquier corte de período puede revertirse para unificar los movimientos con el ciclo anterior sin perder datos.
- **Rendición Transparente o Unificada**: Exportación para WhatsApp o CSV en modo detallado o unificado (ideal para rendir gastos a los padres sin fricciones).
### Modelo de Almacenamiento: Local-First Híbrido
La app **no depende de la conectividad para funcionar**, pero **tampoco se limita a un único dispositivo**:
1. **Capa Local (Caché / 0ms)**: Las operaciones de guardado, edición y lectura ocurren primero contra el store local (`localStorage` + Zustand), garantizando respuesta instantánea en 0 milisegundos y operatividad total offline.
2. **Capa Cloud (Fuente de Verdad Multi-Dispositivo)**: Al contar con conexión y una cuenta activa, un motor de sincronización en segundo plano propaga los cambios a una base de datos relacional PostgreSQL alojada en Supabase mediante WebSockets y REST.
3. **Multi-Dispositivo en Tiempo Real**: Si cargás un gasto en tu teléfono celular, aparece instantáneamente en la pantalla de tu computadora sin recargar.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Notas |
| Capa | Tecnología | Rol / Notas |
|---|---|---|
| Build tool | **Vite** | Template `react-ts` |
| Framework | **React 19** | SPA pura, sin frameworks meta (no Next.js) |
| Build tool | **Vite** | Template `react-ts` con HMR ultra-rápido |
| Framework | **React 19** | SPA pura, sin frameworks meta pesados |
| Lenguaje | **TypeScript**, modo estricto | `strict: true`; `any` prohibido salvo justificación explícita |
| Estilos | **Tailwind CSS v4** | Approach CSS-first (`@tailwindcss/vite`, sin `tailwind.config.js`) |
| Estado global | **Zustand** | Con middleware `persist` para el store financiero |
| Estilos | **Tailwind CSS v4** | Approach CSS-first (`@tailwindcss/vite`) |
| Estado local | **Zustand** | Store financiero con middleware `persist` (caché local offline) |
| Backend & Base de Datos | **Supabase (PostgreSQL)** | Cluster en `sa-east-1` (São Paulo), tipos estrictos y checks de monto |
| Seguridad | **Row Level Security (RLS)** | Aislamiento estricto de datos por usuario (`auth.uid() = user_id`) |
| Autenticación | **Supabase Auth** | Email + Contraseña, auto-confirmación mediante trigger SQL en `auth.users` |
| Tiempo Real | **Supabase Realtime** | Replicación por WebSockets (`postgres_changes`) |
| Sincronización | **Sync Engine Custom** | Sincronización Local-First, merge bidireccional y resolución LWW |
| Hosting & CDN | **Vercel** | Edge Network global, HTTPS automático y enrutamiento SPA (`vercel.json`) |
| PWA | **vite-plugin-pwa** | Manifest + Service Worker, instalable y offline-first |
| Íconos | **Lucide React** | Ver tabla de iconografía en `openspec/design.md` |
| Persistencia | **localStorage** | Sin backend, sin DB. Exportable a texto plano y CSV |
| PWA | **vite-plugin-pwa** | Manifest + Service Worker, instalable y offline-first |

No se agregan dependencias fuera de esta lista sin que quede reflejado acá primero (ver Regla de Oro #8).

---

## 🤖 Instrucciones para Agentes de IA (LEER ANTES DE TOCAR CÓDIGO)

Si sos un agente de IA (Claude Code, Cursor, Antigravity o cualquier otro) trabajando sobre este repositorio, lo que sigue es de cumplimiento obligatorio. No es una sugerencia.

### Orden de Lectura Obligatorio

1. **`README.md`** (este archivo) — contexto, stack, reglas.
2. **`openspec/design.md`** — contrato de datos, arquitectura de componentes, copy exacto.
3. **`openspec/tasks.md`** — qué se construye, en qué orden, y dónde están los puntos de control.
1. **`README.md`** (este archivo) — contexto, stack, enlaces y reglas de arquitectura.
2. **`openspec/design.md`** — contrato de datos, arquitectura de componentes, tabla de strings y esquema Postgres.
3. **`openspec/sync_spec.md`** — especificación detallada del motor de sincronización y autenticación.
4. **`openspec/tasks.md`** — plan de tareas ejecutadas, orden cronológico y checkpoints.

No se empieza a escribir código sin haber leído los tres documentos, en ese orden.

### Reglas de Oro

1. **Una tarea a la vez.** Tomá el primer checkbox `[ ]` sin marcar de `openspec/tasks.md`, dentro del Track activo, y no toques nada que no corresponda a esa tarea.
2. **Esperá el OK explícito del usuario antes de picar código de la tarea siguiente.** Terminar una tarea no es luz verde automática para la próxima. Confirmá qué tarea vas a encarar, por su número (ej: "A.2.3"), antes de escribir una sola línea.
3. **Los Tracks son secuenciales.** No se arranca el Track B sin haber cerrado y confirmado el Track A. Mismo criterio para B → C.
4. **No inventes alcance.** Si algo no está en `openspec/design.md` ni en `openspec/tasks.md`, no lo resuelvas "a criterio propio": preguntale al usuario.
5. **Marcá `[x]` solo cuando la tarea esté completa y validada** (compila, lintea, se probó a mano), nunca antes.
6. **TypeScript estricto siempre.** `any` implícito o explícito está prohibido salvo un comentario `// justificación: ...` inmediatamente arriba.
7. **El copy en español no se parafrasea.** Los textos visibles al usuario son los que están en la tabla de `openspec/design.md`, palabra por palabra. Si falta un texto, se pregunta o se propone uno nuevo para esa tabla — no se inventa inline.
8. **No se suman dependencias nuevas** sin que primero se agreguen a la tabla de stack de este README y lo confirme el usuario.
1. **Arquitectura Local-First sagrada.** Toda mutación escribe inmediatamente en el store local. Las llamadas al backend ocurren de forma asíncrona mediante los listeners de sincronización sin bloquear la interfaz.
2. **Una tarea a la vez.** Tomá el primer checkbox `[ ]` sin marcar de `openspec/tasks.md`, dentro del Track activo, y no toques nada que no corresponda a esa tarea.
3. **TypeScript estricto siempre.** `any` implícito o explícito está prohibido salvo un comentario `// justificación: ...` inmediatamente arriba.
4. **El copy en español no se parafrasea.** Los textos visibles al usuario son los que están en la tabla `STRINGS` de `src/constants/strings.ts` (con voseo argentino/latinoamericano).
5. **No inventes dependencias.** No se agregan dependencias fuera de la tabla de stack sin aprobación explícita.
6. **Políticas de Seguridad RLS.** Jamás crear consultas que salteen las políticas de RLS o expongan datos de otros usuarios.

### Ejemplo de Interacción Esperada

> **Usuario:** Dale, arrancá.  
> **Agente:** Voy a tomar la tarea **A.1.1 — Crear proyecto con Vite**, la primera del Track A. ¿Confirmás?  
> **Usuario:** Sí, dale.  
> **Agente:** *(implementa únicamente A.1.1, corre `npm run dev` para validar)*  
> **Agente:** Listo. Proyecto creado con Vite + template `react-ts`, corre en `localhost:5173`. Marqué `[x]` en A.1.1 de `openspec/tasks.md`. ¿Seguimos con A.1.2?  

Este patrón — una tarea, una confirmación, un checkbox — se repite durante todo el proyecto.

---

## ⚙️ Comandos

```bash
npm install          # instala dependencias
npm run dev          # servidor de desarrollo (Vite, con HMR)
npm run dev          # servidor de desarrollo local (Vite, con HMR)
npm run build        # type-check + build de producción
npm run preview      # sirve el build de producción localmente
npm run lint         # ESLint
npm run lint         # ESLint / Oxlint
npm run typecheck    # tsc --noEmit, sin generar output
npx vercel --prod    # despliegue directo a producción en Vercel
```

---

## 🗺️ Mapa del Repositorio

```
delayspend/
├── README.md
├── openspec/
│   ├── design.md
│   └── tasks.md
│   ├── design.md            # Diseño técnico, contratos, UI y esquema de base de datos
│   ├── sync_spec.md         # Especificación técnica del Sync Engine y Supabase
│   └── tasks.md             # Plan de construcción y registro de tareas cumplidas
├── supabase/
│   └── migrations/
│       ├── 20260911000000_create_expenses.sql     # Tabla expenses, índices, RLS y Realtime
│       └── 20260911000001_auto_confirm_users.sql  # Trigger PL/pgSQL de auto-confirmación
├── public/
│   ├── manifest.webmanifest
│   └── icons/
│   ├── manifest.webmanifest # Manifiesto PWA para instalación móvil y de escritorio
│   └── icons/               # Íconos adaptativos 192x192 y 512x512
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   └── supabase.ts      # Inicialización del cliente Supabase con persistencia JWT
│   ├── components/
│   │   ├── layout/          # Header, Layout
│   │   ├── auth/            # AuthModal (Inicio de sesión, registro y vinculación cloud)
│   │   ├── layout/          # Header (con badge reactivo de sync), Layout
│   │   ├── dashboard/       # SummaryCards y sus 3 tarjetas, PeriodFilter
│   │   ├── history/         # ExpenseHistory, ExpenseHistoryGroup, ExpenseListItem
│   │   ├── form/            # AddExpenseSheet, ExpenseForm, FloatingActionButton
│   │   ├── export/          # ExportPanel
│   │   ├── export/          # ExportPanel (Reportes para WhatsApp y CSV)
│   │   ├── export/          # ExportPanel (Reportes para WhatsApp y CSV detallados o unificados)
│   │   └── ui/              # Button, Card, BottomSheet, ConfirmDialog, Badge, EmptyState, Toaster
│   ├── store/
│   │   ├── types.ts         # Expense, ExpenseType, Category
│   │   ├── useExpenseStore.ts
│   │   ├── useFilterStore.ts
│   │   └── useToastStore.ts
│   │   ├── types.ts         # Expense, ExpenseType, Category, PeriodFilterState, FinancialMetrics
│   │   ├── useExpenseStore.ts # Store de gastos con persistencia y hooks de sincronización
│   │   ├── useAuthStore.ts    # Store de autenticación y manejo de sesión Supabase
│   │   ├── useSyncStore.ts    # Motor de sincronización, Realtime WebSocket y merge
│   │   ├── useFilterStore.ts  # Store de períodos activos
│   │   └── useToastStore.ts   # Store de notificaciones efímeras
│   ├── utils/
│   │   ├── metrics.ts       # cálculo de las 3 métricas
│   │   ├── format.ts        # moneda y fechas
│   │   ├── date.ts          # agrupado y filtrado por período
│   │   ├── export.ts        # generación de texto/CSV
│   │   └── id.ts
│   │   ├── metrics.ts       # Cálculo de las métricas financieras conductuales
│   │   ├── format.ts        # Moneda argentina ($ ARS) y formateo de fechas
│   │   ├── date.ts          # Agrupado cronológico y validación de períodos
│   │   ├── export.ts        # Generador de reportes en texto plano y CSV con BOM
│   │   ├── export.ts        # Generador de reportes en texto plano y CSV (detallado y unificado)
│   │   └── id.ts            # Generador UUID seguro
│   └── constants/
│       ├── categories.ts
│       └── strings.ts       # ÚNICA fuente de verdad del copy en español
│       ├── categories.ts    # Catálogo de 10 categorías con íconos Lucide y colores
│       └── strings.ts       # ÚNICA fuente de verdad del copy en español con voseo
├── index.html
├── vite.config.ts
├── vercel.json              # Configuración de rewrite SPA para Vercel
├── vite.config.ts           # Configuración de Vite con Tailwind y vite-plugin-pwa
├── tsconfig.json
└── package.json
```

Detalle completo de responsabilidades por componente en `openspec/design.md`.

---

## ✅ Criterios de Aceptación Globales ("Done when")

El proyecto está terminado (v1) cuando **todo** lo siguiente es verdad:
El proyecto cumple al 100% con los siguientes criterios de calidad en producción:

- [ ] Compila sin errores de TypeScript en modo estricto, sin `any` no justificado.
- [ ] `npm run build` no tira warnings de Tailwind ni del plugin de PWA.
- [ ] La app es instalable como PWA y funciona 100% offline después de la primera carga.
- [ ] Recargar la página (F5) nunca borra un gasto ya cargado.
- [ ] Toda acción destructiva (eliminar gasto) pasa por `ConfirmDialog`. `window.confirm` no aparece en ningún lugar del código.
- [ ] Toda acción relevante (agregar, eliminar, marcar transferido, copiar, exportar) dispara un toast con el texto exacto de `openspec/design.md`.
- [ ] El formulario de carga es 100% operable con una sola mano en un viewport de 375px de ancho.
- [ ] El monto a transferir (métrica estrella) baja a $0 después de usar "Ya lo transferí", y solo vuelve a subir con nuevos delays.
- [ ] El export en texto se copia con un solo tap y se pega directo en WhatsApp sin edición manual.
- [ ] El export en CSV abre correctamente en una spreadsheet (Excel/Sheets), con columnas legibles.
- [x] Compila sin errores de TypeScript en modo estricto, sin `any` no justificado.
- [x] `npm run build` no tira warnings de Tailwind ni del plugin de PWA.
- [x] `npm run build` no genera advertencias de Tailwind ni del plugin de PWA.
- [x] La app es instalable como PWA y funciona 100% offline después de la primera carga.
- [x] Recargar la página (F5) nunca borra un gasto ya cargado.
- [x] Toda acción destructiva (eliminar gasto) pasa por `ConfirmDialog`. `window.confirm` no aparece en ningún lugar del código.
- [x] Toda acción relevante (agregar, eliminar, marcar transferido, copiar, exportar) dispara un toast con el texto exacto de `openspec/design.md`.
- [x] El formulario de carga es 100% operable con una sola mano en un viewport de 375px de ancho.
- [x] El monto a transferir (métrica estrella) baja a $0 después de usar "Ya lo transferí", y solo vuelve a subir con nuevos delays.
- [x] El export en texto se copia con un solo tap y se pega directo en WhatsApp sin edición manual.
- [x] El export en CSV abre correctamente en una spreadsheet (Excel/Sheets), con columnas legibles.
- [x] Recargar la página (F5) o cambiar de dispositivo preserva todos los gastos del usuario.
- [x] Soporte multi-dispositivo en tiempo real vía WebSockets: los gastos cargados en el teléfono aparecen de inmediato en la computadora.
- [x] Cuentas de usuario protegidas con Supabase Auth y Row Level Security (RLS) en PostgreSQL.
- [x] Registro ágil sin fricción: auto-confirmación por trigger en la base de datos sin depender de emails ni límites de SMTP.
- [x] Toda acción destructiva pasa por `ConfirmDialog`. `window.confirm` está prohibido en todo el código.
- [x] Toda acción relevante dispara un toast con el texto exacto estipulado en las especificaciones.
- [x] El formulario de carga es 100% operable con una sola mano en viewports de 375px de ancho.
- [x] El monto a transferir (métrica estrella) baja a $0 al usar "Ya lo transferí", y solo vuelve a subir con nuevos delays.
- [x] El reporte para WhatsApp se copia en un solo tap y se pega directamente sin requerir edición manual.
- [x] El archivo CSV descargado abre correctamente en Microsoft Excel y Google Sheets con codificación UTF-8 BOM.
- [x] Soporte para rendición unificada (para rendir a padres): permite consolidar todos los gastos sin distinguir delayeados y justificar el total presupuestario.
- [x] El archivo CSV descargado abre correctamente en Microsoft Excel y Google Sheets con codificación UTF-8 BOM (en modo detallado o unificado).
- [x] Despliegue activo en la nube en Vercel y repositorio sincronizado en GitHub.

---

## 📏 Reglas de Código

- **TypeScript estricto real**, no solo `strict: true` de nombre. Se recomienda además en `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "noFallthroughCasesInSwitch": true,
      "forceConsistentCasingInFileNames": true
    }
  }
  ```
- **Nunca usar `window.confirm`, `window.alert` ni `window.prompt`.** Para confirmaciones destructivas: `ConfirmDialog`. Para feedback de acciones: `Toaster` (ver `openspec/design.md`).
- **Toda mutación de datos pasa por acciones del store de Zustand.** Ningún componente muta `expenses` directamente ni escribe a `localStorage` a mano.
- **Un componente por archivo**, nombre de archivo en PascalCase igual al componente. Si un componente supera ~200 líneas, se parte.
- **Los strings visibles al usuario nunca se hardcodean inline.** Siempre se importan desde `constants/strings.ts`.
- **El formateo de moneda y fecha siempre pasa por `utils/format.ts`.** Nada de `toFixed()` suelto en un componente.
- **Mobile-first de verdad**: se diseña primero para 375px de ancho y se escala hacia arriba con los breakpoints de Tailwind (`sm:`, `md:`, etc.), nunca al revés.
- Commits atómicos por tarea (recomendado si el repo usa git): un commit = una tarea de `openspec/tasks.md`.
- **TypeScript estricto real**: Sin tipos laxos ni evasión de tipos.
- **Nunca usar `window.confirm`, `window.alert` ni `window.prompt`**: Siempre componentes accesibles (`ConfirmDialog`, `Toaster`).
- **Toda mutación de datos pasa por acciones del store**: La sincronización escucha los cambios de forma reactiva a través de listeners desacoplados.
- **Los strings visibles al usuario nunca se hardcodean inline**: Siempre se importan desde `constants/strings.ts`.
- **Mobile-first de verdad**: Diseño optimizado prioritariamente para 375px de ancho.

---

## 📂 Sobre esta Especificación

Este repositorio sigue una metodología *spec-driven*: `openspec/` es la fuente de verdad de qué se construye y cómo. El código nunca contradice al spec — si hace falta cambiar algo, se actualiza `design.md` o `tasks.md` primero, y recién después se toca el código.

Este repositorio sigue una metodología *spec-driven*: la carpeta `openspec/` es la fuente de verdad de la arquitectura, diseño y ejecución. Toda nueva funcionalidad debe quedar reflejada en las especificaciones antes de su implementación en código.
