# DelaySpend — Manual de Uso y Guía Operativa Completa

> **Versión:** 1.5.0 · **Última actualización:** Septiembre 2026  
> **Propósito del documento:** Servir como manual integral de referencia para usuarios, desarrolladores y agentes de inteligencia artificial. Explica en detalle el qué, el porqué, el cómo y las reglas de negocio de cada funcionalidad de DelaySpend.

---

## Índice de Contenidos

1. [Filosofía, Propósito y Razón de Ser](#1-filosofía-propósito-y-razón-de-ser)
2. [Flujo Diario de Uso y Registro de Movimientos](#2-flujo-diario-de-uso-y-registro-de-movimientos)
3. [Ciclos y Períodos Financieros](#3-ciclos-y-períodos-financieros)
4. [Las 4 Naturalezas de Gasto y su Impacto](#4-las-4-naturalezas-de-gasto-y-su-impacto)
5. [Categorías, Personalización y Privacidad Familiar](#5-categorías-personalización-y-privacidad-familiar)
6. [Metas de Gasto y Presupuestos Multitemporales](#6-metas-de-gasto-y-presupuestos-multitemporales)
7. [Módulo de Analíticas y Ahorro Acumulado](#7-módulo-de-analíticas-y-ahorro-acumulado)
8. [Rendición de Cuentas y Exportación para Padres](#8-rendición-de-cuentas-y-exportación-para-padres)
9. [Sincronización en la Nube y Uso Multi-Dispositivo](#9-sincronización-en-la-nube-y-uso-multi-dispositivo)
10. [Preguntas Frecuentes y Resolución de Problemas (FAQ)](#10-preguntas-frecuentes-y-resolución-de-problemas-faq)

---

## 1. Filosofía, Propósito y Razón de Ser

### 1.1 El Problema Conductual: La plata que "no gastás" se evapora igual
En la vida cotidiana, cuando decidís no comprarte un café de especialidad de $4.000, unas zapatillas impulsivas de $80.000 o una suscripción innecesaria, **sentís que ahorraste**, pero en la realidad financiera ese dinero se queda en tu cuenta corriente bancaria o billetera virtual (Mercado Pago, etc.). Al cabo de 48 horas, terminás gastándolo en cualquier otra cosa trivial.

El ahorro por postergación suele fracasar por dos motivos de economía conductual:
1. **Falta de registro tangible:** No hay registro de la victoria de autocontrol.
2. **Dilución en la cuenta corriente:** El dinero no gastado no tiene destino asignado y se mezcla con el dinero disponible para gastar hoy.

### 1.2 La Solución DelaySpend
DelaySpend introduce una fricción positiva:
1. **Pausar y Registrar:** En el instante en que vas a comprar algo por impulso, abrís la app y lo registrás como compra postergada (*DelaySpend*).
2. **Convertir el autocontrol en un número real:** La app suma todos tus impulsos frenados y te presenta la **métrica estrella**: *"Monto a Transferir a Caja de Ahorro"*.
3. **Mover la plata:** Con un toque en *"Ya lo transferí"*, sabés exactamente cuántos pesos tenés que transferir de tu cuenta diaria a tu caja de ahorro remunerada o plazo fijo. El contador vuelve a $0 y tu ahorro quedó blindado.

### 1.3 El Caso de Uso Especial: Rendición de Cuentas a Padres
Muchos estudiantes o personas jóvenes viven con dinero transferido por sus padres:
- El dinero no llega necesariamente el día 1 de cada mes calendario: suele transferirse **a demanda o en ciclos irregulares** (ej: "$50.000 para tirar 15 días").
- Los padres piden saber en qué se fue el dinero antes de hacer una nueva transferencia.
- Existen tres tensiones clásicas en esta dinámica:
  1. **El desorden:** Acordarse de memoria de tickets chicos y compras sueltas es agotador.
  2. **Gastos personales legítimos pero sensibles:** Hay gastos importantes para el usuario (como peluquería, tratamientos capilares, estética, ropa o salidas) que frente a los padres pueden generar preguntas incómodas o reproches innecesarios.
  3. **Compras para la casa:** Si vas a la verdulería o al supermercado y comprás cosas para la casa de tus padres, ese dinero no es un consumo propio tuyo ni debería ensuciar tu promedio de gasto diario.

DelaySpend resuelve estas tres tensiones de forma elegante: permite **agrupar por períodos de dinero**, **aislar compras para la casa**, **enmascarar rubros sensibles como "Otros Gastos"** y generar un **resumen prolijo para WhatsApp o Excel sin ninguna mención a compras postergadas ni a DelaySpend**, cerrando el total exacto al centavo.

---

## 2. Flujo Diario de Uso y Registro de Movimientos

El botón flotante principal **(+)** en la esquina inferior abre la hoja táctil de carga (*BottomSheet*), operable con una sola mano.

### 2.1 Tipo de Movimiento: Real, Postergado o Ingreso
Existen tres tipos de movimiento en DelaySpend:

1. **💸 Gasto Real (`real`)**:
   - Plata que efectivamente salió de tu bolsillo o cuenta bancaria.
   - Resta del saldo disponible de tu ciclo actual y suma al total gastado.
2. **🛡️ Compra Postergada / Delayeada (`delayed`)**:
   - Un producto o servicio que ibas a comprar y decidiste frenar o postergar.
   - No resta de tu saldo disponible (porque no pagaste nada).
   - Suma al **Monto a Transferir** para que lo muevas a tu cuenta de ahorro.
3. **💵 Ingreso Extra (`income`)**:
   - Plata que te ingresó en medio del período (una transferencia extra de tus padres, un reintegro, un laburo freelance).
   - Suma directamente al saldo disponible de tu ciclo activo.

### 2.2 Ahorro por Opción Más Barata (Sobreprecio Evitado)
Al cargar un **Gasto Real**, se habilita la opción:
> *"¿Elegiste una opción más barata?"*

**Ejemplo real:** Ibas a comprar una campera de $100.000, pero buscaste y compraste una excelente por $70.000.
- Monto del gasto real: `$70.000`.
- Monto ahorrado por opción barata: `$30.000`.
- **Efecto en la app:** Se anota el gasto real de $70.000 y se genera automáticamente un crédito de ahorro DelaySpend de $30.000 para transferir a tu cuenta de ahorro. ¡Premio directo por comprar inteligente!

### 2.3 Marcar como "Ya lo transferí"
En la tarjeta principal del dashboard verás:
> **Monto a transferir:** `$35.000`  
> Botón: `[Ya lo transferí]`

Al tocar el botón (o confirmar en el diálogo):
- Todos los gastos delayeados pendientes y sobreprecios evitados se marcan como transferidos con su fecha y hora (`transferredAt = ISO 8601`).
- El contador vuelve inmediatamente a `$0`.
- La plata quedó a resguardo en tu cuenta de ahorro y el historial conserva la constancia de cuándo se transfirió.

---

## 3. Ciclos y Períodos Financieros

En lugar de forzar al usuario a ver sus finanzas del 1 al 30 de cada mes, DelaySpend utiliza **Ciclos de Período**.

### 3.1 ¿Qué es un Ciclo?
Un ciclo representa una etapa de financiamiento. Por ejemplo:
- *"Ciclo Inicial (50k transferidos por papá)"* del 1 al 15 de Septiembre.
- *"Segunda Quincena"* del 16 de Septiembre en adelante.

Cada ciclo almacena:
- **Nombre:** Ej. *"Período 1"*, *"Quincena Septiembre"*.
- **Fecha de inicio:** Cuándo empezó a correr ese dinero.
- **Fecha de cierre:** `null` si es el ciclo en curso, o una fecha ISO si ya fue cerrado.
- **Ingreso asignado:** Cuánta plata te dieron al arrancar (ej: $50.000).
- **Gasto de corte opcional (`cutoffExpenseId`):** El ID del gasto exacto a partir del cual se inició el ciclo.

### 3.2 Saldo Disponible Remanente
En la cabecera del período activo se calculan dos métricas inmediatas:
$$\text{Ingreso Asignado Total} = \text{Ingreso Inicial} + \sum \text{Ingresos Extras}$$
$$\text{Saldo Disponible} = \text{Ingreso Asignado Total} - \sum \text{Gastos Reales}$$

Si tu ingreso fue de $50.000 y gastaste $28.000, tu saldo disponible es de **$22.000**.

### 3.3 Dos Formas de Iniciar un Nuevo Ciclo
Cuando recibís nuevo dinero o querés reiniciar tus contadores a $0:

1. **Desde el botón "Reiniciar contadores / Nuevo período":**
   - Abrís el modal, elegís nombre, fecha de inicio y monto de ingreso transferido.
   - El período actual se cierra con fecha de hoy y el nuevo arranca con contadores en $0.
2. **Corte fijado por gasto específico:**
   - Si hiciste gastos hoy pero el dinero nuevo te lo transfirieron **después** de cierto gasto:
   - Vas al gasto en el historial, tocás los 3 puntitos o el menú contextual y elegís **"Iniciar nuevo período acá"**.
   - Ese gasto y todos los posteriores pasan al nuevo ciclo, dejando los gastos viejos en el ciclo cerrado anterior.

### 3.4 Deshacer Corte (Undo) sin Pérdida de Datos
Si creaste un período por error o querés fusionar dos períodos consecutivos:
- En la barra del período tocás **"Deshacer corte"**.
- El sistema reunifica los gastos con el ciclo previo, elimina el corte y recalcula todos los balances sin perder un solo registro.

---

## 4. Las 4 Naturalezas de Gasto y su Impacto

En el formulario de carga de cualquier gasto o compra postergada se puede seleccionar la **Naturaleza del Gasto**. Existen 4 opciones:

| Naturaleza | Ícono | Nombre | Propósito y Criterio | ¿Afecta Ritmo Corriente? |
|---|:---:|---|---|:---:|
| `daily` | 🛒 | **Cotidiano / Corriente** | Gastos del día a día: almuerzo, kiosco, café, transporte, birra, salidas comunes. | **SÍ** |
| `fixed` | 🔄 | **Fijo / Recurrente** | Gastos mensuales obligatorios: gimnasio, alquiler, internet, abono del celular, suscripción a software. | **NO** |
| `eventual` | ⚡ | **Eventual / Esporádico** | Gastos necesarios pero de baja frecuencia: corte de pelo, campera de abrigo, arreglo de una bicicleta, dentista. | **NO** |
| `house` | 🏠 | **Para la Casa** | Compras hechas con tu dinero pero destinadas al hogar o a la familia: verdulería familiar, productos de limpieza, comida para todos. | **NO** |

### 4.1 ¿Por qué separamos Fijos, Eventuales y Para la Casa del Ritmo Corriente?
Si un martes te cortás el pelo por $20.000 o comprás productos para la casa por $28.000:
- Si esos montos se dividieran por los días del período, tu promedio diario se dispararía artificialmente (ej: "$15.000 por día"), haciéndote creer que estás gastando de más en tu vida cotidiana.
- DelaySpend **aísla los gastos fijos, eventuales y de la casa** para que tu indicador de **Ritmo Diario Corriente** refleje pura y exclusivamente tus hábitos diarios evitables.
- Sin embargo, **sí se descuentan del ingreso de tu ciclo**, porque al fin y al cabo la plata salió de tu saldo.
- En la rendición para padres, las compras para la casa aparecen claramente rotuladas como `[🏠 Para la casa]` y con un subtotal destacado para demostrar qué dinero fue para el hogar.

---

## 5. Categorías, Personalización y Privacidad Familiar

### 5.1 Catálogo de Categorías Nativas
DelaySpend incluye 11 rubros nativos diseñados con íconos Lucide y paletas cromáticas diferenciadas:
1. 🍔 **Comida:** Almuerzos, cenas, delivery, snacks.
2. 🛒 **Supermercado:** Almacén, despensa, compras generales.
3. 🚌 **Transporte:** SUBE, nafta, Uber, taxi, tren.
4. 🎮 **Ocio:** Cine, juegos, salidas, recitales.
5. 👕 **Ropa:** Indumentaria, calzado, accesorios.
6. 💻 **Tecnología:** Hardware, electrónica, cables.
7. 💳 **Suscripciones:** Spotify, Netflix, servidores.
8. 💊 **Salud:** Farmacia, consultas médicas, remedios.
9. ✂️ **Estética:** Peluquería, barbería, cuidado personal, tratamientos capilares.
10. 📚 **Educación:** Libros, cursos, fotocopias.
11. 📦 **Otros:** Gastos misceláneos.

### 5.2 Creación de Categorías Personalizadas
En **Ajustes > Presupuestos y Categorías**:
- Tocá **"+ Crear categoría"**.
- Ingresá el nombre deseado.
- Elegí entre 15 íconos visuales y 8 paletas de colores.
- Queda inmediatamente disponible para registrar gastos y asignar metas.

### 5.3 Sistema de Privacidad y Censura para Padres
En **Ajustes > Privacidad en Rendición a Padres**, podés activar el enmascaramiento con un toque sobre cualquier categoría (por ejemplo, **Estética**).

**¿Cómo funciona?**
- En tu app, ves todo con su categoría real: *"Finasteride / Minoxidil - Estética - $25.000"*.
- Al generar el reporte de WhatsApp o exportar el CSV para tus padres:
  - La categoría se reemplaza automáticamente por **"Otros Gastos"**.
  - El monto ($25.000) permanece 100% exacto para que el total transferido y rendido cierre al centavo.
  - Evitás discusiones familiares sobre si ese gasto era "prioritario o superfluo".

---

## 6. Metas de Gasto y Presupuestos Multitemporales

En la pestaña de **Analíticas** y en **Ajustes**, DelaySpend ofrece un sistema flexible de metas presupuestarias en 4 horizontes temporales:

```
[ 🔄 Por Ciclo ]   [ 📅 Por Mes ]   [ ⏱️ Por Semana ]   [ ⚡ Personalizado ]
```

1. **Por Ciclo (`cycle`):** Vinculado directamente al período activo actual. Toma el dinero transferido y computa los días activos desde la fecha de inicio del ciclo.
2. **Por Mes (`monthly`):** Monitorea el gasto del día 1 al último día del mes calendario actual, indicando los días restantes del mes y el presupuesto diario recomendado.
3. **Por Semana (`weekly`):** Monitorea el gasto de lunes a domingo. Ideal para quienes se ponen un tope semanal (ej: $30.000 por semana).
4. **Personalizado (`custom`):** Permite fijar un lapso a medida (ej: 10 días, 15 días, 20 días) mediante un selector numérico.

### 6.1 Ritmo Diario Corriente: Real vs Con DelaySpend
Dentro de la tarjeta de metas, el indicador de ritmo diario corriente muestra dos métricas en simultáneo:
- **Gasto corriente real diario:** `spentDaily / daysActive` (cuánta plata estás quemando por día en salidas y compras del día a día).
- **Ritmo proyectado con DelaySpend:** `(spentDaily + delayedDaily) / daysActive` (a cuánto se hubiera ido tu promedio diario si no hubieses frenado esas compras postergadas).

Esto te da una validación matemática inmediata: *"Si hubiera comprado esas cosas que delayeé, estaría gastando $12.000 por día en vez de $7.000"*.

---

## 7. Módulo de Analíticas y Ahorro Acumulado

### 7.1 Ahorro Acumulado: Estrictamente Períodos Cerrados
Una regla de oro de DelaySpend es que **el ahorro acumulado histórico solo computa períodos que ya fueron cerrados** (`endDate !== null`).

**Razón:** En el período en curso, el dinero todavía está en movimiento; computar el sobrante de un período que no terminó daría una ilusión de ahorro que podría gastarse mañana.

El ahorro acumulado se compone de:
1. **Ahorro por compras postergadas:** Suma de todas las compras delayeadas y sobreprecios evitados de los ciclos cerrados.
2. **Sobrante de ingresos:** Suma del dinero transferido que sobró al cierre de cada ciclo:
   $$\text{Sobrante de Ciclo} = \max(0, \text{Ingreso Efectivo} - \text{Gastos Reales})$$
   $$\text{Ahorro Histórico Total} = \text{Ahorro Postergado} + \text{Sobrante de Ingresos}$$

### 7.2 Selector Interactivo de Naturalezas en los Gráficos
En Analíticas, arriba del gráfico de dona de categorías, tenés 4 casillas interactivas:
- 🛒 **Cotidianos**
- 🔄 **Fijos**
- ⚡ **Eventuales**
- 🏠 **Para la casa**

Botones rápidos:
- **"Todas":** Marca las 4 casillas para analizar la totalidad de los egresos.
- **"Solo corrientes":** Desmarca fijos, eventuales y casa con un solo clic para ver únicamente en qué rubros se te va la plata del día a día. El gráfico de dona se recalcula en tiempo real.

### 7.3 Selector de Período para Auditoría Histórica
Podés tocar el botón de selección de ciclo para examinar:
- El ciclo actualmente activo.
- Cualquier ciclo pasado cerrado con su fecha de inicio y fin.
- Todo el historial consolidado acumulado.

---

## 8. Rendición de Cuentas y Exportación para Padres

El panel de exportación (accesible desde el ícono de compartir en el Dashboard o el Historial) genera el reporte formal para tus padres.

### 8.1 Cero Menciones a "DelaySpend"
Por diseño, **en ningún lugar del texto de WhatsApp ni del archivo CSV aparece la palabra "DelaySpend"**. El reporte se titula simplemente:
`📊 *Rendición de Gastos*`
Los padres ven un informe contable limpio, sobrio y profesional.

### 8.2 Menú de Configuración Personalizada (Tuerquita ⚙️)
Al lado del interruptor de rendición unificada hay un botón de tuerquita ⚙️ que despliega las opciones avanzadas del reporte:

1. **Casilla "Mostrar categoría en cada gasto":**
   - Si está marcada: incluye la categoría entre corchetes (ej: `• 15/09: Almuerzo - $6.500 [Comida]`).
   - Si una categoría está enmascarada por privacidad, se muestra como `[Otros Gastos]`.
   - Si está desmarcada: muestra solo fecha, concepto y monto (ej: `• 15/09: Almuerzo - $6.500`).
2. **Casilla "Mostrar etiqueta de naturaleza":**
   - Agrega o quita las marcas: `[🏠 Para la casa]`, `[🔄 Fijo]`, `[⚡ Eventual]`, `[🛒 Cotidiano]`.
3. **Casillas individuales de naturalezas a incluir:**
   - Podés tildar o destildar selectivamente: Cotidianos, Fijos, Eventuales o Para la casa.
   - Si solo querés rendir lo que compraste para la casa, desmarcás las otras tres y listo.
4. **Modo de Resumen Financiero al final:**
   - **Detalle completo:** Muestra ingreso asignado, total a rendir, saldo disponible remanente y total destinado a la casa.
   - **Solo total a rendir:** Termina simplemente diciendo:
     `📈 *Total:*`  
     `• Total a rendir: $48.200`
5. **Persistencia Automática:** Toda opción que cambies en el menú ⚙️ se guarda automáticamente en tu navegador (`localStorage`), de modo que tus preferencias quedan listas para la próxima vez.

### 8.3 Ejemplo de Reporte Generado para WhatsApp
```text
📊 *Rendición de Gastos*
🗓 *Período:* Período 2 (01/09 al Presente)

💸 *Detalle de Gastos del Período:*
• 16/09: Verdulería semanal - $28.000 [Comida] 🏠 [Para la casa]
• 15/09: Farmacia y botiquín - $8.500 [Salud]
• 14/09: Almuerzo facultad - $6.200 [Comida] 🛒 [Cotidiano]
• 12/09: Tratamiento personal - $18.000 [Otros Gastos] ⚡ [Eventual]
• 10/09: Abono transporte - $9.000 [Transporte] 🔄 [Fijo]

📈 *Resumen Financiero:*
• Ingreso asignado al período: $80.000,00
• Total a rendir / reponer: $69.700,00
• Saldo disponible remanente: $10.300,00
🏠 Total destinado a la casa: $28.000,00
```

### 8.4 Exportación CSV para Microsoft Excel
El archivo CSV descargado incluye codificación **UTF-8 BOM (`\uFEFF`)** obligatoria, lo que garantiza que las tildes, caracteres especiales (`ñ`, `$`) y columnas abran a la perfección en Excel para Windows, macOS y Google Sheets sin deformarse.

---

## 9. Sincronización en la Nube y Uso Multi-Dispositivo

DelaySpend funciona bajo un modelo **Local-First Híbrido**:

```
Dispositivo Móvil (iPhone/Android)              Supabase Cloud (PostgreSQL)            Computadora (PC/Mac)
       │                                                    │                                   │
   Carga Gasto                                              │                                   │
       ├──► 1. Guarda en Zustand/Storage (0ms)               │                                   │
       │       UI se actualiza instantáneamente             │                                   │
       │                                                    │                                   │
       └──► 2. Sync Engine envía upsert en segundo plano ──►│                                   │
                                                            ├──► 3. Realtime WebSocket ────────►│
                                                            │       propaga cambio (<1s)        └──► 4. Se actualiza la
                                                            │                                           pantalla en vivo
```

### 9.1 Registro de Cuenta Instantáneo (Sin Esperas de Email)
Para evitar el límite de 2 emails por hora del plan gratuito de Supabase, la base de datos cuenta con un trigger PL/pgSQL (`auto_confirm_user`) que auto-confirma la cuenta en el acto. Podés registrarte con tu correo y contraseña e iniciar sesión inmediatamente sin esperar confirmaciones.

### 9.2 Trabajo 100% Offline
Si estás en el subte o en un lugar sin señal:
- Podés cargar gastos, editar o consultar tu dinero normalmente.
- Todo se escribe en el almacenamiento local de tu navegador.
- En cuanto el dispositivo recupera conexión, el motor de sincronización sube los cambios pendientes a la nube automáticamente.

---

## 10. Preguntas Frecuentes y Resolución de Problemas (FAQ)

### ¿Qué pasa si cargo un gasto en mi celular y no aparece en mi computadora?
Verificá en la cabecera que ambos dispositivos tengan la sesión iniciada con la misma cuenta. Si en uno dice "Sincronizar", tocá ahí e ingresá con tu correo. Una vez iniciada la sesión, la sincronización es automática vía WebSockets.

### ¿Cómo hago si quise empezar un período nuevo pero me olvidé de incluir un gasto en el período anterior?
Podés ir al gasto, tocar editar y cambiarle la fecha para que quede antes de la fecha de inicio del ciclo nuevo, o tocar **"Deshacer corte"** en el período actual para reunificarlos y volver a hacer el corte en el momento deseado.

### ¿Las compras postergadas se suman a lo que tengo que rendir a mis padres?
En el **modo unificado para padres**, todos los movimientos cargados justifican el dinero presupuestario recibido. Si querés que no aparezcan, podés desactivar el modo unificado o utilizar las opciones de configuración de la tuerquita ⚙️ para incluir únicamente los gastos reales cotidianos.

### ¿Por qué mi gasto de verdulería para la casa no subió mi promedio diario corriente?
Porque le asignaste la naturaleza **"Para la casa" (`house`)**. El sistema aísla inteligentemente ese monto de tu ritmo de consumo personal para no penalizar tus métricas de disciplina individual, pero sí lo descuenta de tu saldo remanente y lo incluye en la rendición de cuentas.

---
*Fin del Manual de Uso — DelaySpend v1.5.0*
