# DelaySpend — Manual de Uso y Guía Operativa Completa

> **Versión:** 1.5.0 · **Última actualización:** Septiembre 2026  
> **Versión:** 1.6.0 · **Última actualización:** Septiembre 2026  
> **Propósito del documento:** Servir como manual integral de referencia para usuarios, desarrolladores y agentes de inteligencia artificial. Explica en detalle el qué, el porqué, el cómo y las reglas de negocio de cada funcionalidad de DelaySpend.

---

## Índice de Contenidos

1. [Filosofía, Propósito y Razón de Ser](#1-filosofía-propósito-y-razón-de-ser)
2. [Flujo Diario de Uso y Registro de Movimientos](#2-flujo-diario-de-uso-y-registro-de-movimientos)
3. [Ciclos y Períodos Financieros](#3-ciclos-y-períodos-financieros)
4. [Las 4 Naturalezas de Gasto y su Impacto](#4-las-4-naturalezas-de-gasto-y-su-impacto)
5. [Categorías, Personalización y Subcategorías Universales](#5-categorías-personalización-y-subcategorías-universales)
6. [Gestión de Privacidad Estricta: Categoría Vicios y Máscaras Ficticias](#6-gestión-de-privacidad-estricta-categoría-vicios-y-máscaras-ficticias)
7. [Metas de Gasto y Presupuestos Multitemporales (Rubros y Subcategorías)](#7-metas-de-gasto-y-presupuestos-multitemporales)
8. [Módulo de Analíticas y Ahorro Acumulado](#8-módulo-de-analíticas-y-ahorro-acumulado)
9. [Rendición de Cuentas y Exportación para Padres](#9-rendición-de-cuentas-y-exportación-para-padres)
10. [Sincronización en la Nube y Uso Multi-Dispositivo](#10-sincronización-en-la-nube-y-uso-multi-dispositivo)
11. [Preguntas Frecuentes y Resolución de Problemas (FAQ)](#11-preguntas-frecuentes-y-resolución-de-problemas-faq)

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
DelaySpend resuelve estas tres tensiones de forma elegante: permite **agrupar por períodos de dinero**, **aislar compras para la casa**, **enmascarar rubros sensibles como "Otros Gastos"**, **proteger al 100% rubros sensibles como Vicios mediante máscaras contables ficticias**, y generar un **resumen prolijo para WhatsApp o Excel sin ninguna mención a compras postergadas ni a DelaySpend**, cerrando el total exacto al centavo.

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

## 5. Categorías, Personalización y Subcategorías Universales

### 5.1 Catálogo de Categorías Nativas
DelaySpend incluye 12 rubros nativos diseñados con íconos Lucide y paletas cromáticas diferenciadas:
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
11. 🔥 **Vicios:** Gastos personales de máxima privacidad (puchos, etc.). Exclusión parental absoluta.
12. 📦 **Otros:** Gastos misceláneos.

### 5.2 Creación de Categorías Personalizadas
En **Ajustes > Presupuestos y Categorías**:
- Tocá **"+ Crear categoría"**.
- Ingresá el nombre deseado, seleccioná ícono y color entre las opciones disponibles.
- Queda inmediatamente disponible para registrar gastos, asociar subcategorías y asignar metas.

### 5.3 Subcategorías Universales para Todas las Categorías
DelaySpend no limita las subcategorías a los vicios: podés organizar **cualquier rubro del sistema** con subcategorías detalladas:
- **Ejemplos prácticos:**
  - 🍕 **Comida:** `Delivery`, `Supermercado`, `Almuerzo facultad/trabajo`, `Kiosco / Snacks`.
  - 🚗 **Transporte:** `Uber / Cabify`, `SUBE / Colectivo`, `Nafta / Combustible`, `Estacionamiento`.
  - 🔥 **Vicios:** `Puchos`, `Alcohol / Cerveza`, `Salidas nocturnas`, `Apuestas`.
  - 💻 **Tecnología:** `Accesorios / Cables`, `Software / Licencias`, `Hardware`.
- **¿Cómo se crean?**
  1. **Al vuelo al anotar un gasto:** Al seleccionar cualquier categoría en el formulario de registro, verás una fila horizontal de chips con las subcategorías existentes y el botón `+ Subcategoría` (o `+ Nueva`). Al tocarlo, ingresás el nombre y se selecciona automáticamente.
  2. **Desde Ajustes:** En **Ajustes > Presupuestos y Categorías**, tocá el botón desplegable de subcategorías de cualquier rubro y usá el campo de texto inferior para crearlas de antemano.
- **Visualización en el Historial:** Cada gasto con subcategoría se presenta con el formato unificado `${Categoría} · ${Subcategoría}` (ej: `Comida · Delivery` o `Vicios · Puchos`).

### 5.4 Sistema de Privacidad y Censura Básica para Padres
En **Ajustes > Privacidad en Rendición a Padres**, podés activar el enmascaramiento sobre cualquier categoría (por ejemplo, **Estética**):
- En tu app, ves todo con su categoría real: *"Finasteride / Minoxidil - Estética - $25.000"*.
- Al generar el reporte de WhatsApp o exportar el CSV para tus padres:
  - La categoría se reemplaza automáticamente por **"Otros Gastos"**.
  - El monto ($25.000) permanece 100% exacto para que el total transferido y rendido cierre al centavo.
  - Evitás discusiones familiares sobre si ese gasto era "prioritario o superfluo".

---

## 6. Gestión de Privacidad Estricta: Categoría Vicios, Subcategorías y Máscaras Ficticias

### 6.1 La Tensión entre Autonomía Personal y Rendición de Cuentas
Hay consumos personales legítimos en la vida privada de una persona joven (cigarrillos, alcohol, salidas particulares, apuestas) que jamás deberían figurar frente a los padres, ni siquiera bajo el rótulo de *"Otros Gastos"*, ya que suscitan interrogatorios familiares sobre qué fue ese dinero.
Al mismo tiempo, si el usuario simplemente no anota el gasto de vicio, el dinero físico o bancario desaparece, el saldo de la app se desincroniza de la billetera virtual real, y la rendición de cuentas final no cuadra con el dinero que los padres transfirieron.

DelaySpend resuelve este dilema con un mecanismo de **Cero Filtración + Máscaras Contables Ficticias**.

### 6.2 La Categoría Sensible "Vicios" y sus Subcategorías Dinámicas
- **Identificador Nativo:** `vices` (ícono `Flame` / Fuego, color ámbar).
- **Subcategorías Personalizadas al Vuelo:** Al seleccionar la categoría Vicios en el formulario de carga, se despliega una barra de chips con subcategorías. Por defecto viene configurada la subcategoría **"Puchos"**, pero podés tocar el botón **"+ Nueva"** para agregar cualquier otra al vuelo (ej: *"Alcohol"*, *"Cerveza"*, *"Juego"*).
- Al seleccionar una subcategoría, el ítem queda registrado con precisión quirúrgica en tu historial personal: `Vicios · Puchos`.

### 6.3 Garantía de Exclusión Total (Regla de Oro Parental)
**Los gastos pertenecientes a la categoría Vicios tienen un 0% de probabilidad de filtrarse a tus padres.**
Tanto en la exportación de texto para WhatsApp como en el archivo CSV para Excel, la categoría `vices` es **incondicionalmente excluida**. No aparece en los detalles, ni en los subtotales, ni en el total a rendir familiar. No hay toggle ni ajuste que pueda habilitarla por descuido.

### 6.4 Gastos Ficticios (Máscaras Contables para Padres)
Para que el dinero gastado en vicios no cause un descuadre en la rendición final ante tus padres, podés crear en cualquier momento un **Gasto Ficticio**:
- **¿Qué es una máscara ficticia?** Es un gasto que anotás como si hubiese existido en una categoría inocua (ej: *Comida* / *Cotidiano* / *"Almuerzo empanadas"* $3.500 o *"Alfajor Havanna y gaseosa"* $2.200).
- **¿Cómo se crea?**
  1. Podés tocar el botón de acceso directo **"Crear Máscara"** en la tarjeta de Balance del Dashboard, o abrir el formulario regular y activar el switch **"🎭 Gasto Ficticio (Máscara para padres)"**.
  2. Le asignás una categoría creíble (Comida, Supermercado, Transporte, etc.) y una descripción común.
  3. No se permite asignar la categoría Vicios a una máscara ficticia (por coherencia contable).
- **¿Cómo aparece en tu historial?** En tu historial personal verás una insignia distintiva color púrpura: `🎭 Ficticio (Máscara)` con el texto aclaratorio *"Solo para padres"*, para que sepas siempre que ese consumo no fue real.

### 6.5 Aislamiento Personal Absoluto
Los gastos ficticios **NO existen para tus finanzas reales**:
- NO se suman al total gastado (`totalReal`).
- NO alteran tu promedio diario corriente ni tu proyección.
- NO consumen tus metas presupuestarias de categorías ni globales.
- NO afectan tu ahorro acumulado histórico.
- **Propósito único y exclusivo:** Sumar en el reporte unificado de los padres para justificar el dinero transferido y absorber los consumos de vicios.

### 6.6 La Tarjeta de Balance Ficticio - Vicios en el Dashboard
En tu Dashboard verás una tarjeta interactiva dedicada a monitorear la salud de tus máscaras contables durante el período activo:

$$\text{Balance Neto} = \sum \text{Gastos Ficticios} - \sum \text{Gastos de Vicios}$$

- **Margen a favor (Balance $\ge \$0$, color verde esmeralda):** Creaste suficientes gastos ficticios para cubrir lo gastado en vicios. Los números para tus padres van a cerrar sin problemas.
- **Saldo pendiente de compensar (Balance $< \$0$, color ámbar):** Gastaste en vicios más de lo que compensaste con máscaras. La tarjeta te alerta con un mensaje claro: *"Faltan compensar \$X para que los números ante tus padres cierren perfecto"*.
- **Acceso Rápido:**
  - Botón **"Crear Máscara"**: Abre la hoja de carga pre-configurada como gasto ficticio.
  - Botón **"Anotar Vicio"**: Abre la hoja de carga pre-configurada en la categoría Vicios.
  - **Desglose Desplegable:** Al tocar la flecha inferior, podés ver el detalle exacto de cuánto llevás en vicios (con su subcategoría) y cuántas máscaras ficticias tenés cargadas en el ciclo.

---

## 7. Metas de Gasto y Presupuestos Multitemporales

En la pestaña de **Analíticas** y en **Ajustes**, DelaySpend ofrece un sistema flexible de metas presupuestarias en 4 horizontes temporales:

```
[ 🔄 Por Ciclo ]   [ 📅 Por Mes ]   [ ⏱️ Por Semana ]   [ ⚡ Personalizado ]
```

1. **Por Ciclo (`cycle`):** Vinculado directamente al período activo actual. Toma el dinero transferido y computa los días activos desde la fecha de inicio del ciclo.
2. **Por Mes (`monthly`):** Monitorea el gasto del día 1 al último día del mes calendario actual, indicando los días restantes del mes y el presupuesto diario recomendado.
3. **Por Semana (`weekly`):** Monitorea el gasto de lunes a domingo. Ideal para quienes se ponen un tope semanal (ej: $30.000 por semana).
4. **Personalizado (`custom`):** Permite fijar un lapso a medida (ej: 10 días, 15 días, 20 días) mediante un selector numérico.

### 6.1 Ritmo Diario Corriente: Real vs Con DelaySpend
### 7.1 Ritmo Diario Corriente: Real vs Con DelaySpend
Dentro de la tarjeta de metas, el indicador de ritmo diario corriente muestra dos métricas en simultáneo:
- **Gasto corriente real diario:** `spentDaily / daysActive` (cuánta plata estás quemando por día en salidas y compras del día a día, sin contar ficticios, eventuales ni fijos).
- **Ritmo proyectado con DelaySpend:** `(spentDaily + delayedDaily) / daysActive` (a cuánto se hubiera ido tu promedio diario si no hubieses frenado esas compras postergadas).

Esto te da una validación matemática inmediata: *"Si hubiera comprado esas cosas que delayeé, estaría gastando $12.000 por día en vez de $7.000"*.

### 7.2 Metas de Gasto por Subcategoría (Vicios, Puchos y Cualquier Rubro)
Además de fijar límites a nivel de categoría general (ej: $60.000 para Comida), DelaySpend te permite definir **metas específicas por subcategoría**:
- **¿Para qué sirve?**
  - Para consumos sensibles con necesidad de autocontrol estricto: por ejemplo, fijar una meta de **$15.000 de ciclo para "Puchos"** o **$8.000 semanales para "Alcohol"**.
  - Para hábitos que desbordan el presupuesto general: por ejemplo, limitar el **"Delivery" a $20.000 mensuales**, aunque tu presupuesto total de Comida sea mayor.
  - Para transporte individual vs público: limitar **"Uber" a $10.000 semanales**.
- **Configuración en Ajustes:**
  - En **Ajustes > Presupuestos y Categorías**, tocá el botón desplegable de subcategorías de cualquier categoría.
  - Para cada subcategoría podés definir la meta por **Ciclo** y la meta **Semanal**. Al escribir el monto, la meta se guarda automáticamente.
  - Podés borrar la meta con el botón rojo de papelera o eliminar la subcategoría si ya no la necesitás.
- **Monitoreo en Analíticas:**
  - En la tarjeta superior de metas de la pestaña **Analíticas**, al cambiar de periodicidad (**Por Ciclo**, **Por Mes**, **Por Semana** o **Personalizado**), se despliega la sección **"Metas por Subcategoría"**.
  - Cada meta muestra:
    - Nombre de la subcategoría y rubro padre entre paréntesis: `Puchos (Vicios)` o `Delivery (Comida)`.
    - Gasto acumulado vs presupuesto fijado.
    - Porcentaje consumido con código de colores (azul si está bajo control, ámbar si superó el 80%, rojo si se excedió).
    - Saldo disponible o monto excedido.
    - Asignación diaria sugerida (`$X / día`) para llegar a fin de período sin pasarte.
- **Aislamiento de Máscaras:** Los gastos ficticios nunca consumen tus metas de subcategoría ni tus metas de categoría general.

---

## 8. Módulo de Analíticas y Ahorro Acumulado

### 7.1 Ahorro Acumulado: Estrictamente Períodos Cerrados
### 8.1 Ahorro Acumulado: Estrictamente Períodos Cerrados
Una regla de oro de DelaySpend es que **el ahorro acumulado histórico solo computa períodos que ya fueron cerrados** (`endDate !== null`).

**Razón:** En el período en curso, el dinero todavía está en movimiento; computar el sobrante de un período que no terminó daría una ilusión de ahorro que podría gastarse mañana.

El ahorro acumulado se compone de:
1. **Ahorro por compras postergadas (DelaySpend):** Suma consolidada de compras delayeadas no consumadas y sobreprecios evitados de los ciclos cerrados.
   - **Desglose interactivo:** Al tocar la tarjeta de *Ahorro DelaySpend*, se despliega un acordeón interactivo que detalla:
     - 🛡️ **Gasto no consumado directamente:** Compras impulsivas que frenaste y postergaste.
     - ✨ **Ahorro por versión más barata:** Sobreprecio evitado al optar por alternativas más económicas (`savedExtraAmount`).
2. **Sobrante de ingresos (Balance Neto):** Suma del dinero que sobró del presupuesto asignado tras rendir cuentas a los padres (es decir, lo que hubiera sobrado si las compras postergadas fueran reales: $\text{Ingreso} - \text{Gasto Real} - \text{DelaySpend}$). Si en un ciclo sobraron $4.800 y en el siguiente faltaron $1.700, el sobrante neto consolidado refleja fielmente $3.100:
   $$\text{Sobrante de Ciclo} = \text{Ingreso Efectivo} - \text{Gastos Reales} - \text{DelaySpend}$$
   $$\text{Ahorro Histórico Total} = \text{Ahorro DelaySpend} + \text{Sobrante de Ingresos} = \text{Ingreso Efectivo} - \text{Gastos Reales}$$

### 7.2 Selector Interactivo de Naturalezas en los Gráficos
*Nota contable:* Los gastos ficticios quedan estrictamente excluidos de este cómputo, garantizando que el ahorro acumulado refleje pesos auténticos conservados.

### 8.2 Selector Interactivo de Naturalezas en los Gráficos
En Analíticas, arriba del gráfico de dona de categorías, tenés 4 casillas interactivas:
- 🛒 **Cotidianos**
- 🔄 **Fijos**
- ⚡ **Eventuales**
- 🏠 **Para la casa**

Botones rápidos:
- **"Todas":** Marca las 4 casillas para analizar la totalidad de los egresos.
- **"Solo corrientes":** Desmarca fijos, eventuales y casa con un solo clic para ver únicamente en qué rubros se te va la plata del día a día. El gráfico de dona se recalcula en tiempo real.

### 7.3 Selector de Período para Auditoría Histórica
### 8.3 Selector de Período para Auditoría Histórica
Podés tocar el botón de selección de ciclo para examinar:
- El ciclo actualmente activo.
- Cualquier ciclo pasado cerrado con su fecha de inicio y fin.
- Todo el historial consolidado acumulado.

---

## 8. Rendición de Cuentas y Exportación para Padres
## 9. Rendición de Cuentas y Exportación para Padres

El panel de exportación (accesible desde el ícono de compartir en el Dashboard o el Historial) genera el reporte formal para tus padres.

### 8.1 Cero Menciones a "DelaySpend"
### 9.1 Cero Menciones a "DelaySpend"
Por diseño, **en ningún lugar del texto de WhatsApp ni del archivo CSV aparece la palabra "DelaySpend"**. El reporte se titula simplemente:
`📊 *Rendición de Gastos*`
Los padres ven un informe contable limpio, sobrio y profesional.

### 8.2 Menú de Configuración Personalizada (Tuerquita ⚙️)
### 9.2 Menú de Configuración Personalizada (Tuerquita ⚙️)
Al lado del interruptor de rendición unificada hay un botón de tuerquita ⚙️ que despliega las opciones avanzadas del reporte:

1. **Casilla "Mostrar categoría en cada gasto":**
   - Si está marcada: incluye la categoría entre corchetes (ej: `• 15/09: Almuerzo - $6.500 [Comida]`).
   - Si una categoría está enmascarada por privacidad, se muestra como `[Otros Gastos]`.
   - Si está desmarcada: muestra solo fecha, concepto y monto (ej: `• 15/09: Almuerzo - $6.500`).
2. **Casilla "Mostrar etiqueta de naturaleza":**
   - Agrega o quita las marcas: `[🏠 Para la casa]`, `[🔄 Fijo]`, `[⚡ Eventual]`, `[🛒 Cotidiano]`.
3. **Casillas individuales de rótulos de naturalezas a mostrar:**
   - Podés elegir para qué naturalezas querés que figure el rótulo al lado del gasto: Cotidianos, Fijos, Eventuales o Para la casa.
   - **Nota contable:** Todos los gastos del período se incluyen siempre en el reporte para que la rendición cuadre con exactitud matemática; las casillas solo determinan si el rótulo descriptivo aparece o se oculta al lado de cada ítem.
   - Si una categoría está enmascarada por privacidad (ej. Estética), se muestra como `[Otros Gastos]`.
   - Si está desmarcada: muestra solo fecha, concepto y monto.
2. **Recuadro "Mostrar etiqueta de naturaleza":**
   - **Interruptor principal:** Habilita o deshabilita los rótulos de naturaleza en el reporte.
   - **Etiquetas de naturaleza a mostrar (dentro del mismo recuadro):** Podés elegir para qué naturalezas querés que figure el rótulo al lado del gasto: 🛒 Cotidianos, 🔄 Fijos, ⚡ Eventuales o 🏠 Para la casa.
   - **Interruptor maestro:** Habilita o deshabilita los rótulos de naturaleza en el reporte.
   - **Etiquetas de naturaleza a mostrar:** Casillas individuales para 🛒 Cotidiano, 🔄 Fijo, ⚡ Eventual y 🏠 Para la casa.
   - **Importante:** Aunque desmarques una etiqueta, el gasto **aparece igual en el reporte** si su naturaleza está incluida.
3. **Recuadro "Naturalezas a incluir en el reporte":**
   - Te permite elegir qué gastos querés incluir o excluir según su naturaleza.
   - Si desmarcás una naturaleza acá (por ejemplo *Fijos*), esos gastos **no se incluirán en el reporte ni sumarán en el total a rendir**.
   - Permite filtrar qué tipos de gastos querés que figuren en la rendición familiar.
   - Si desmarcás una naturaleza acá (ej: *Fijos*), esos gastos **no se incluirán en el texto ni sumarán en el total a rendir**.
4. **Modo de Resumen Financiero al final:**
   - **Detalle completo:** Muestra ingreso asignado, total a rendir, saldo disponible remanente y total destinado a la casa.
   - **Solo total a rendir:** Termina simplemente diciendo:
     `📈 *Total:*`  
     `• Total a rendir: $48.200`
5. **Persistencia Automática:** Toda opción que cambies en el menú ⚙️ se guarda automáticamente en tu navegador (`localStorage`), de modo que tus preferencias quedan listas para la próxima vez.
   - **Solo total a rendir:** Emite únicamente la línea final con el monto total a reponer.
5. **Persistencia Automática:** Toda opción que cambies en el menú ⚙️ se guarda automáticamente en `localStorage` (`delayspend_parent_export_config_v1`).

### 8.3 Ejemplo de Reporte Generado para WhatsApp
### 9.3 Ejemplo de Reporte Generado para WhatsApp
```text
📊 *Rendición de Gastos*
🗓 *Período:* Período 2 (01/09 al Presente)

💸 *Detalle de Gastos del Período:*
• 16/09: Verdulería semanal - $28.000 [Comida] 🏠 [Para la casa]
• 15/09: Farmacia y botiquín - $8.500 [Salud]
• 14/09: Almuerzo facultad - $6.200 [Comida] 🛒 [Cotidiano]
• 13/09: Alfajor y merienda - $2.200 [Comida] 🛒 [Cotidiano]
• 12/09: Tratamiento personal - $18.000 [Otros Gastos] ⚡ [Eventual]
• 10/09: Abono transporte - $9.000 [Transporte] 🔄 [Fijo]

📈 *Resumen Financiero:*
• Ingreso asignado al período: $80.000,00
• Total a rendir / reponer: $69.700,00
• Saldo disponible remanente: $10.300,00
• Total a rendir / reponer: $71.900,00
• Saldo disponible remanente: $8.100,00
🏠 Total destinado a la casa: $28.000,00
```
*(Notar cómo la compra de puchos no aparece, el alfajor de $2.200 actúa como máscara contable cerrando la suma, y el tratamiento de estética figura inocuamente como Otros Gastos).*

### 8.4 Exportación CSV para Microsoft Excel
### 9.4 Exportación CSV para Microsoft Excel
El archivo CSV descargado incluye codificación **UTF-8 BOM (`\uFEFF`)** obligatoria, lo que garantiza que las tildes, caracteres especiales (`ñ`, `$`) y columnas abran a la perfección en Excel para Windows, macOS y Google Sheets sin deformarse.

---

## 9. Sincronización en la Nube y Uso Multi-Dispositivo
## 10. Sincronización en la Nube y Uso Multi-Dispositivo

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
### 10.1 Registro de Cuenta Instantáneo (Sin Esperas de Email)
Para evitar el límite de 2 emails por hora del plan gratuito de Supabase, la base de datos cuenta con un trigger PL/pgSQL (`auto_confirm_user`) que auto-confirma la cuenta en el acto. Podés registrarte con tu correo y contraseña e iniciar sesión inmediatamente sin esperar confirmaciones.

### 9.2 Trabajo 100% Offline
### 10.2 Trabajo 100% Offline
Si estás en el subte o en un lugar sin señal:
- Podés cargar gastos, editar o consultar tu dinero normalmente.
- Todo se escribe en el almacenamiento local de tu navegador.
- En cuanto el dispositivo recupera conexión, el motor de sincronización sube los cambios pendientes a la nube automáticamente.

---

## 10. Preguntas Frecuentes y Resolución de Problemas (FAQ)
## 11. Preguntas Frecuentes y Resolución de Problemas (FAQ)

### ¿Qué pasa si compré un atado de puchos de $1.200 y tengo que rendir gastos a fin de semana?
Cargalo tranquilamente en la categoría **Vicios** (subcategoría Puchos). Ese gasto se resta de tu saldo disponible real (porque la plata salió de tu billetera), pero **nunca** aparecerá en el reporte de tus padres. Para que ante tus padres los números cuadren al centavo, tocá **"Crear Máscara"** en la tarjeta de Balance y cargá un gasto ficticio de $1.200 (por ejemplo: *"Café y medialunas"* o *"Kiosco y merienda"*). La tarjeta de balance te va a quedar en `$0` (verde) y a tus padres les va a llegar la rendición perfecta sin sospechas.

### ¿Los gastos ficticios me ensucian mis analíticas o me hacen creer que gasté de más?
No, en absoluto. Los gastos ficticios están programados para ser completamente ignorados en tus analíticas personales: no suman al gasto real de tus métricas, no afectan el cálculo de tu promedio diario corriente, no consumen tus metas de presupuesto y no tocan el ahorro acumulado de períodos cerrados. Son 100% invisibles para tus métricas personales y solo cobran vida al generar el reporte de padres.

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

*Fin del Manual de Uso — DelaySpend v1.6.0*
