# DelaySpend — Plan de Tareas de Construcción e Historial (Tasks)

> **Documento:** `openspec/tasks.md`  
> **Versión:** 1.5.0 · **Estado:** Tracks A, B, C, D, E y F 100% Completados y Validados en Producción  
> **Metodología:** OpenSpec / ChangeSpec

---

## 🚦 Leyenda de Estados
- `[ ]` Tarea pendiente
- `[x]` Tarea completada, probada y validada
- 🛑 **Punto de Control (Checkpoint)**: Pausa obligatoria de validación antes de avanzar.

---

## 📦 TRACK A: Estructura Base, Modelo de Datos & Formulario de Carga Mobile-First

*Objetivo: Inicializar el proyecto con Vite, TypeScript estricto, Tailwind v4 y construir el formulario de carga táctil.*

- [x] **A.1.1 — Inicialización del proyecto con Vite y TypeScript**
- [x] **A.1.2 — Instalación de dependencias autorizadas (`zustand`, `lucide-react`, `@tailwindcss/vite`, `vite-plugin-pwa`)**
- [x] **A.1.3 — Configuración de Tailwind CSS v4 y directivas de safe-areas**
- [x] **A.1.4 — Configuración de TypeScript en modo estricto exhaustivo**
- [x] **A.2.1 — Definición de contratos y tipos TypeScript (`src/store/types.ts`)**
- [x] **A.2.2 — Catálogo de categorías e iconografía Lucide (`src/constants/categories.ts`)**
- [x] **A.2.3 — Tabla de strings con voseo argentino (`src/constants/strings.ts`)**
- [x] **A.3.1 — Utilidades de ID seguro y formateo de moneda argentina (`src/utils/format.ts`)**
- [x] **A.3.2 — Store de notificaciones toast con auto-remoción (`src/store/useToastStore.ts`)**
- [x] **A.3.3 — Store financiero en memoria (`src/store/useExpenseStore.ts`)**
- [x] **A.4.1 — Componentes UI base: Button, Card y Badge (`src/components/ui/`)**
- [x] **A.4.2 — Componente Toaster accesible**
- [x] **A.4.3 — Formulario móvil de carga de gastos con BottomSheet táctil**

---

## 📊 TRACK B: Dashboard de Métricas Conductuales e Historial de Movimientos

*Objetivo: Visualizar los indicadores de gasto, el monto a transferir a ahorro y el historial ordenado por fecha.*

- [x] **B.1.1 — Motor de cálculo de métricas financieras (`src/utils/metrics.ts`)**
- [x] **B.1.2 — Tarjetas de resumen financiero (Gasto Real, Compras Postergadas, Monto a Transferir)**
- [x] **B.1.3 — Acción de transferencia a caja de ahorro ("Ya lo transferí")**
- [x] **B.2.1 — Historial cronológico agrupado por fecha con badges por tipo**
- [x] **B.2.2 — Edición y eliminación de movimientos con diálogo modal accesible (`ConfirmDialog`)**
- [x] **B.3.1 — Persistencia local offline con middleware `persist` de Zustand en `localStorage`**

---

## 📤 TRACK C: Rendición de Cuentas, Exportación y PWA

*Objetivo: Generar reportes prolijos para WhatsApp y hojas de cálculo CSV con codificación UTF-8 BOM.*

- [x] **C.1.1 — Generador de texto para WhatsApp con formato monoespaciado y subtotales**
- [x] **C.1.2 — Generador y descargador de archivo CSV con BOM para Microsoft Excel**
- [x] **C.1.3 — Panel de exportación táctil con copia en un clic al portapapeles**
- [x] **C.2.1 — Configuración del Service Worker y manifiesto PWA para instalación móvil**
- [x] **C.2.2 — Verificación de funcionamiento 100% offline**

---

## ☁️ TRACK D: Sincronización Multi-Dispositivo, Cloud Backend & Autenticación

*Objetivo: Integrar Supabase PostgreSQL con Row Level Security, WebSockets Realtime y auto-confirmación de cuentas.*

- [x] **D.1.1 — Configuración del cliente Supabase con persistencia JWT en `localStorage`**
- [x] **D.1.2 — Migración DDL de tabla `expenses`, claves foráneas, índices y políticas RLS**
- [x] **D.1.3 — Trigger SQL `auto_confirm_users` para bypass del límite SMTP de Supabase**
- [x] **D.2.1 — Store de autenticación (`useAuthStore`) y modal de login/registro (`AuthModal`)**
- [x] **D.2.2 — Sync Engine bidireccional con resolución Last-Write-Wins (LWW) y soft deletes**
- [x] **D.2.3 — Suscripción en tiempo real vía WebSockets (`postgres_changes`)**
- [x] **D.3.1 — Despliegue en producción en Vercel Edge Network (`https://delayspend.vercel.app`)**

---

## 🔄 TRACK E: Ciclos de Período, Asignación de Ingresos y Corte por Gasto

*Objetivo: Permitir al usuario reiniciar contadores, gestionar períodos irregulares de dinero y cortar por gasto.*

- [x] **E.1.1 — Entidad `Period` en TypeScript y tabla PostgreSQL con RLS y Realtime**
- [x] **E.1.2 — Store `usePeriodStore` para ciclos de financiamiento y cálculo de saldo remanente**
- [x] **E.1.3 — Ahorro extra por opción más barata (`savedExtraAmount` / sobreprecio evitado)**
- [x] **E.1.4 — Modal para iniciar nuevo ciclo con ingreso asignado o corte por fecha**
- [x] **E.2.1 — Corte fijado por gasto específico (`cutoffExpenseId`) desde el historial**
- [x] **E.2.2 — Reversión de corte ("Deshacer corte") para fusionar períodos sin perder datos**
- [x] **E.2.3 — Tipo de movimiento `income` para registrar transferencias e ingresos extras del ciclo**

---

## 🎯 TRACK F: Naturalezas de Gasto, Analíticas Avanzadas, Metas y Rendición Personalizada

*Objetivo: Aislar gastos del ritmo corriente, ofrecer metas multitemporales y permitir exportación a padres con tuerquita ⚙️.*

- [x] **F.1.1 — Modelo de 4 naturalezas de gasto (`daily`, `fixed`, `eventual`, `house`) en tipos y base de datos**
- [x] **F.1.2 — Aislamiento de fijos, eventuales y casa del cálculo del promedio diario corriente**
- [x] **F.1.3 — Categoría nativa *Estética* (`aesthetics`) y soporte para categorías personalizadas con ícono y paleta**
- [x] **F.1.4 — Sistema de privacidad parental: enmascaramiento automático de rubros sensibles como *"Otros Gastos"***
- [x] **F.2.1 — Módulo de Metas de Gasto Multitemporales (`cycle`, `monthly`, `weekly`, `custom`) en `useBudgetStore`**
- [x] **F.2.2 — Visualización del ritmo diario corriente real y proyectado con DelaySpend**
- [x] **F.2.3 — Auditoría de Ahorro Acumulado histórico computando estrictamente períodos cerrados**
- [x] **F.2.4 — Selector interactivo de naturalezas en el gráfico de dona de analíticas (con botones "Todas" y "Solo corrientes")**
- [x] **F.2.5 — Selector de período para navegar y auditar ciclos anteriores en analíticas**
- [x] **F.3.1 — Eliminación absoluta del término "DelaySpend" en todas las exportaciones para padres**
- [x] **F.3.2 — Botón de tuerquita ⚙️ con menú de personalización de exportación:**
  - Casilla para mostrar u ocultar categoría.
  - Casilla para mostrar u ocultar etiquetas de naturaleza.
  - 4 casillas individuales para seleccionar qué naturalezas incluir.
  - Selector de modo de resumen financiero (Detalle completo vs Solo total a rendir).
- [x] **F.3.3 — Persistencia automática de las preferencias de exportación en `localStorage`**

---
*Fin del Registro de Tareas — DelaySpend v1.5.0*
