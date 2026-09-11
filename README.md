# DelaySpend

> Cada gasto que evitás vale tanto como cada peso que gastás. DelaySpend lo registra, lo mide, y te dice exactamente cuánto mover a tu cuenta de ahorro.

**Tipo de proyecto:** PWA de finanzas personales basada en psicología conductual  
**Arquitectura:** 100% cliente — sin backend, sin base de datos, sin autenticación  
**Metodología de desarrollo:** Spec-driven, inspirada en OpenSpec/ChangeSpec  
**Versión de este documento:** 1.0.0 · **Última actualización:** 2026-09-11

---

## 🎯 Filosofía del Proyecto

DelaySpend parte de una idea simple de economía conductual: la fricción de "anotar que estuviste a punto de gastar" alcanza para cambiar el hábito, y esa plata que no gastaste merece un destino concreto, no diluirse en la cuenta de todos los días.

La app trackea dos tipos de eventos, no uno:

- **Gasto real**: plata que efectivamente salió de tu bolsillo.
- **Gasto delayeado**: una compra que ibas a hacer y decidiste postergar (o directamente no hacer). Ese monto **no se gastó**, pero tampoco debería "perderse" en la cuenta corriente: DelaySpend calcula exactamente cuánto de esa plata tenés que mover a una cuenta remunerada o de ahorro.

Como caso de uso principal (aunque no excluyente), está pensada para alguien a quien sus padres le financian los gastos del mes: la app funciona como herramienta de **rendición de cuentas transparente**, generando un resumen prolijo y exportable para mandar por WhatsApp o mail, sin necesidad de mostrar el resto de la cuenta bancaria.

No hay servidor. No hay usuarios ni contraseñas. Todo el estado vive en el `localStorage` del navegador y se puede exportar en texto plano o CSV en cualquier momento.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Build tool | **Vite** | Template `react-ts` |
| Framework | **React 19** | SPA pura, sin frameworks meta (no Next.js) |
| Lenguaje | **TypeScript**, modo estricto | `strict: true`; `any` prohibido salvo justificación explícita |
| Estilos | **Tailwind CSS v4** | Approach CSS-first (`@tailwindcss/vite`, sin `tailwind.config.js`) |
| Estado global | **Zustand** | Con middleware `persist` para el store financiero |
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
npm run build        # type-check + build de producción
npm run preview      # sirve el build de producción localmente
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit, sin generar output
```

---

## 🗺️ Mapa del Repositorio

```
delayspend/
├── README.md
├── openspec/
│   ├── design.md
│   └── tasks.md
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── layout/          # Header, Layout
│   │   ├── dashboard/       # SummaryCards y sus 3 tarjetas, PeriodFilter
│   │   ├── history/         # ExpenseHistory, ExpenseHistoryGroup, ExpenseListItem
│   │   ├── form/            # AddExpenseSheet, ExpenseForm, FloatingActionButton
│   │   ├── export/          # ExportPanel
│   │   └── ui/              # Button, Card, BottomSheet, ConfirmDialog, Badge, EmptyState, Toaster
│   ├── store/
│   │   ├── types.ts         # Expense, ExpenseType, Category
│   │   ├── useExpenseStore.ts
│   │   ├── useFilterStore.ts
│   │   └── useToastStore.ts
│   ├── utils/
│   │   ├── metrics.ts       # cálculo de las 3 métricas
│   │   ├── format.ts        # moneda y fechas
│   │   ├── date.ts          # agrupado y filtrado por período
│   │   ├── export.ts        # generación de texto/CSV
│   │   └── id.ts
│   └── constants/
│       ├── categories.ts
│       └── strings.ts       # ÚNICA fuente de verdad del copy en español
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Detalle completo de responsabilidades por componente en `openspec/design.md`.

---

## ✅ Criterios de Aceptación Globales ("Done when")

El proyecto está terminado (v1) cuando **todo** lo siguiente es verdad:

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
- [x] La app es instalable como PWA y funciona 100% offline después de la primera carga.
- [x] Recargar la página (F5) nunca borra un gasto ya cargado.
- [x] Toda acción destructiva (eliminar gasto) pasa por `ConfirmDialog`. `window.confirm` no aparece en ningún lugar del código.
- [x] Toda acción relevante (agregar, eliminar, marcar transferido, copiar, exportar) dispara un toast con el texto exacto de `openspec/design.md`.
- [x] El formulario de carga es 100% operable con una sola mano en un viewport de 375px de ancho.
- [x] El monto a transferir (métrica estrella) baja a $0 después de usar "Ya lo transferí", y solo vuelve a subir con nuevos delays.
- [x] El export en texto se copia con un solo tap y se pega directo en WhatsApp sin edición manual.
- [x] El export en CSV abre correctamente en una spreadsheet (Excel/Sheets), con columnas legibles.

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

---

## 📂 Sobre esta Especificación

Este repositorio sigue una metodología *spec-driven*: `openspec/` es la fuente de verdad de qué se construye y cómo. El código nunca contradice al spec — si hace falta cambiar algo, se actualiza `design.md` o `tasks.md` primero, y recién después se toca el código.

