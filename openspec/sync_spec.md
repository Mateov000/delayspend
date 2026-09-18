# Especificación Técnica — Sincronización Multi-Dispositivo y Nube (DelaySpend)
# Especificación Técnica — Sincronización Multi-Dispositivo, Cloud Backend y Autenticación (DelaySpend)
# Especificación Técnica — Motor de Sincronización Multi-Dispositivo, Cloud Backend y Autenticación (DelaySpend)

**Documento:** `openspec/sync_spec.md`  
**Versión:** 1.0.0 · **Estado:** Propuesta de Arquitectura  
**Versión:** 1.1.0 · **Estado:** Implementado y Desplegado en Producción  
**Metodología:** OpenSpec / ChangeSpec  
> **Documento:** `openspec/sync_spec.md`  
> **Versión:** 1.5.0 · **Estado:** Implementado y Activo en Producción  
> **Metodología:** OpenSpec / ChangeSpec

---

## 1. 🎯 Diagnóstico y Justificación Arquitectónica
## 1. 🎯 Diagnóstico y Modelo Arquitectónico

### El Desafío
DelaySpend nació como una PWA 100% cliente que persiste su estado en el `localStorage` del navegador. Si bien esto garantiza máxima velocidad y privacidad inicial, presenta una limitación fundamental:
- Si el usuario carga un gasto en su **teléfono celular**, ese gasto **no existe en su computadora** ni en su tablet.
- Si el usuario borra la memoria caché del navegador o cambia de teléfono, corre el riesgo de perder el historial si no exportó previamente.
### El Desafío Original (v1.0.0)
DelaySpend nació como una PWA basada exclusivamente en el almacenamiento local del navegador (`localStorage`). Aunque esto otorgaba máxima velocidad y privacidad inicial, presentaba barreras críticas para el usuario:
- **Silos de datos**: Un gasto anotado en el teléfono celular no existía en la computadora de escritorio ni en la tablet.
- **Riesgo de pérdida**: Limpiar los datos del navegador o cambiar de teléfono borraba el historial si el usuario no realizaba exportaciones periódicas a mano.
### 1.1 El Desafío
DelaySpend nació como una PWA con almacenamiento en `localStorage`. Si bien otorgaba velocidad instantánea y funcionamiento offline sin costo de infraestructura, presentaba tres limitaciones críticas:
1. **Silos de datos:** Un gasto anotado en el teléfono celular en la calle no existía al abrir la computadora en casa.
2. **Riesgo de pérdida:** Limpiar cookies o restaurar el teléfono borraba el historial financiero si no se hacían exportaciones manuales frecuentes.
3. **Fricción familiar:** Al rendir cuentas a fin de ciclo, el usuario prefiere generar y revisar el informe cómodamente desde la PC de escritorio.

### La Solución: Arquitectura Local-First con Sincronización en Nube
Para resolver esto sin degradar la experiencia de usuario (UX) ni romper la filosofía de fricción cero:
1. **La app sigue siendo Offline-First**: No hay que esperar a que el backend responda para registrar un gasto. Se guarda primero en local en 0ms y se sincroniza en segundo plano.
2. **Backend Serverless (Supabase)**:
   - Base de datos PostgreSQL relacional con Row Level Security (RLS) para aislamiento estricto por usuario.
   - Supabase Auth (Email + Contraseña) para que el usuario vincule todos sus dispositivos con una misma cuenta.
   - Supabase Realtime (WebSocket sobre PostgreSQL Replication) para propagar cambios de un dispositivo a otro en menos de 1 segundo.
3. **Hosting y Distribución Global (Vercel)**:
   - Despliegue global en Edge Network con SSL automático y soporte PWA.
   - URL pública accesible desde cualquier teléfono, tablet o PC (ej: `delayspend.vercel.app`).
   - Sincronización instantánea de Service Workers con soporte offline.
### La Solución Implementada: Arquitectura Local-First Híbrida (v1.1.0)
Para superar estas limitaciones sin perder la velocidad ni la resiliencia offline:
1. **La app se mantiene 100% Offline-First**: No se espera a que la red responda para confirmar una acción. Toda alta o edición se guarda en local en 0ms y se sincroniza en segundo plano.
2. **Backend Relacional Cloud (Supabase PostgreSQL)**:
   - Base de datos relacional robusta en la región de menor latencia (`sa-east-1`, São Paulo).
   - Aislamiento estricto mediante **Row Level Security (RLS)**: Cada usuario únicamente accede a sus propios registros (`auth.uid() = user_id`).
   - Autenticación segura mediante Supabase Auth con sesiones JWT persistidas en el cliente.
   - **Supabase Realtime**: Replicación continua por WebSockets que propaga altas, ediciones y bajas entre dispositivos en menos de 1 segundo.
3. **Distribución y Hosting Global (Vercel Edge)**:
   - Despliegue continuo con HTTPS obligatorio en [https://delayspend.vercel.app](https://delayspend.vercel.app).
   - Enrutamiento SPA sin recargas de página mediante `vercel.json`.
### 1.2 La Solución: Arquitectura Local-First Híbrida
Para resolverlo sin degradar la experiencia de 0 milisegundos ni requerir conexión a internet obligatoria para anotar un gasto:
1. **La app se mantiene 100% Offline-First:** Toda operación de guardado o edición se ejecuta inmediatamente contra Zustand y `localStorage` en 0ms.
2. **Sincronización Asíncrona en Segundo Plano:** En cuanto hay red y una sesión iniciada, el motor despacha las mutaciones hacia Supabase sin bloquear la interfaz de usuario.
3. **Replicación Bidireccional por WebSockets:** Supabase Realtime propaga las altas, ediciones y bajas entre dispositivos en menos de 1 segundo mediante el protocolo `postgres_changes`.

---

## 2. 🗄️ Modelo de Datos y Esquema PostgreSQL (Supabase)
## 2. 🗄️ Modelo de Datos y Esquema PostgreSQL (`public.expenses`)
## 2. 🗄️ Esquema Relacional de Sincronización (PostgreSQL / Supabase)

El backend corre en un clúster PostgreSQL en São Paulo (`sa-east-1`, menor latencia para Sudamérica):

```sql
-- Tabla principal de movimientos sincronizados
-- Tabla principal de gastos y compras postergadas
-- Tabla de Movimientos Financieros
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('real', 'delayed')),
  type text not null check (type in ('real', 'delayed', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft delete para propagar borrados a otros dispositivos
  deleted_at timestamptz,
  period_id uuid references public.periods(id) on delete set null,
  saved_extra_amount numeric(12, 2) check (saved_extra_amount >= 0),
  nature text not null default 'daily' check (nature in ('daily', 'fixed', 'eventual', 'house')),
  tags text[],
  installment_group_id uuid,
  installment_number integer,
  installment_total integer
);

-- Índices de alto rendimiento
-- Tabla de Ciclos y Períodos
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

-- Índices optimizados
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_expenses_user_updated on public.expenses(user_id, updated_at desc);
create index if not exists idx_periods_user_start on public.periods(user_id, start_date desc);

-- Políticas de Seguridad RLS
-- Políticas de Seguridad Row Level Security (RLS)
-- Seguridad Row Level Security (RLS)
alter table public.expenses enable row level security;
alter table public.periods enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
create policy "Users can only access their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
create policy "Users can only access their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Habilitar replicación en tiempo real para la tabla
-- Habilitación de replicación en tiempo real
-- Replicación en tiempo real habilitada
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.periods;
```

---

## 3. 🔄 Estrategia de Sincronización (Sync Engine)
## 3. ⚡ Trigger de Auto-Confirmación de Usuarios (Bypass de SMTP)
## 3. ⚡ Bypass de SMTP: Auto-Confirmación de Cuentas

Para evitar la fricción en el registro y eludir el límite gratuito de Supabase de 2 emails de confirmación por hora, se incorporó una función trigger en PostgreSQL (`supabase/migrations/20260911000001_auto_confirm_users.sql`):
Para evitar el límite de 2 emails por hora del plan gratuito de Supabase (que provocaría rechazos de registro), la base de datos cuenta con una función trigger que marca las cuentas como confirmadas en el momento exacto de la inserción en `auth.users`:

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

Esto permite que cualquier usuario nuevo comience a sincronizar sus gastos de manera inmediata al registrarse, sin demoras ni rechazos por cuota de correo.
Esto garantiza un registro con **fricción cero**: el usuario escribe su email y clave e inicia sesión de inmediato sin salir de la app ni consultar su bandeja de entrada.

---

## 4. 🔄 Estrategia de Sincronización (Sync Engine)
## 4. 🔄 Flujo de Sincronización y Ciclo de Vida de Datos

El flujo de sincronización desacopla completamente la experiencia de usuario del estado de la red:

```
[Dispositivo Móvil]                   [Supabase Cloud]                    [Computadora / Laptop]
      │                                      │                                       │
  (Nuevo Gasto)                              │                                       │
      ├──── 1. Guarda en localStorage (0ms)   │                                       │
      │        y actualiza UI en vivo        │                                       │
      ├──── 1. Guarda en Zustand/Storage ────┼───────────────────────────────────────┤
      │        (0ms de latencia)             │                                       │
      │                                      │                                       │
      ├──── 2. POST / Upsert en background ─►│                                       │
      │                                      ├───── 3. Evento Realtime (WebSocket) ─►│
      │                                      │                                       ├──── 4. Actualiza Zustand +
      │                                      │                                       │        localStorage local
      ├──── 2. Dispara listener reactivo ───►│                                       │
      │        (upsert en segundo plano)     ├───── 3. Evento Realtime (WebSocket) ─►│
      │                                      │                                       ├──── 4. Actualiza Zustand
      │                                      │                                       │        y caché local
      ▼                                      ▼                                       ▼
[Dispositivo A: Teléfono]                  [Supabase Cloud]                 [Dispositivo B: PC]
         │                                        │                                   │
  (Registra Gasto)                                │                                   │
         ├──► 1. Guarda en Zustand/Storage        │                                   │
         │       (0ms de latencia)                │                                   │
         │                                        │                                   │
         └──► 2. Sync Engine despacha Upsert ────►│                                   │
                                                  ├──► 3. WebSockets Realtime ───────►│
                                                  │       (`postgres_changes`)        └──► 4. Zustand actualiza estado
                                                  │                                           y UI sin recargar (<1s)
```

### Reglas de Conflicto y Resolución:
- **Last-Write-Wins (LWW) basado en `updatedAt`**: Si un gasto se edita en dos dispositivos en simultáneo, prevalece la versión con timestamp `updated_at` más reciente.
- **Borrados con Soft-Delete**: Para evitar que un dispositivo desconectado vuelva a resucitar un gasto borrado en otro dispositivo, los borrados se marcan inicialmente con `deleted_at = now()` y se propagan antes de la purga física.
- **Migración inicial sin pérdida de datos**: Si el usuario ya venía usando la app en su celular con datos en `localStorage` y luego inicia sesión, el Sync Engine toma esos datos locales y los sube a Supabase automáticamente.
### 4.1 Listener Reactivo Desacoplado
`useExpenseStore.ts` exporta `registerSyncListener((action, item) => void)`. Al ejecutar `addExpense`, `updateExpense`, `deleteExpense` o `markAllPendingAsTransferred`, el store local notifica a `useSyncStore` sin acoplar dependencias directas de Supabase en el store financiero.
### 4.1 Reglas de Sincronización y Merge:
1. **Last-Write-Wins (LWW) basado en `updatedAt`:** Ante un conflicto de edición simultáneo entre dos dispositivos, el servidor y los clientes eligen la entidad con el timestamp `updatedAt` más reciente.
2. **Soft Deletes con `deletedAt`:** Los registros eliminados no se borran físicamente de inmediato. Se les asigna `deleted_at = now()` para que el cambio viaje a todos los dispositivos sincronizados. Una vez replicado el borrado, el registro se descarta del almacenamiento local.
3. **Migración Transparente Local -> Nube:** Si el usuario utiliza la app de forma anónima (offline) acumulando gastos en `localStorage` y posteriormente inicia sesión o crea su cuenta, el Sync Engine toma automáticamente todos los registros locales y los migra hacia su cuenta en Supabase.

### 4.2 Merge Inteligente al Iniciar Sesión (`syncAllWithCloud`)
Cuando un usuario que utilizaba la app en modo local inicia sesión:
1. Consulta todos los registros del usuario en Supabase (`is.deleted_at.null`).
2. Compara con los registros locales en memoria.
3. Si un registro local no existe en la base remota (o tiene un `updatedAt` superior), se incluye en un batch de `upsert` a Supabase.
4. Se actualiza el store local con el set consolidado ordenado cronológicamente.

### 4.3 Resolución de Conflictos y Concurrencia
- **Last-Write-Wins (LWW)**: Basado en el campo `updated_at` (ISO 8601 UTC). Si dos dispositivos modifican un registro, la última marca temporal prevalece.
- **Soft-Deletes**: Al eliminar un movimiento, se estampa `deleted_at = now()` en la base remota. Los clientes conectados mediante WebSocket reciben el payload y lo eliminan de su estado local.

---

## 4. 🌐 Infraestructura y Despliegue en Vercel
## 5. 🛡️ Autenticación y Experiencia de Entrada
## 5. 🔌 Manejo de Red, Colas y Reconexión

1. **Configuración SPA (`vercel.json`)**:
- **Sanitización automática**: Eliminación de espacios en blanco al inicio/final y normalización a minúsculas (`cleanEmail = email.trim().toLowerCase()`) para evitar errores por autocompletado en teclados móviles.
- **Optimización de Teclado Móvil**: `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck="false"`.
- **Detección inteligente de cuentas**: Si un usuario intenta registrarse con un email ya registrado, la interfaz conmuta de inmediato a la pestaña de "Iniciar Sesión" y solicita únicamente la contraseña.
1. **Detección de Conectividad:** El store `useSyncStore` escucha los eventos `online` y `offline` del navegador.
2. **Badge de Estado en Header:**
   - 🟢 *Sincronizado:* Todo el estado local coincide con la nube.
   - 🟡 *Sincronizando...:* Hay mutaciones en tránsito.
   - ⚪ *Sin conexión:* Operando en modo local; los cambios se guardan en la cola offline.
   - 🔵 *Sincronizar:* Usuario no autenticado (modo invitado).
3. **Drenaje Automático de Cola:** Al restablecerse la conexión a internet, se dispara una sincronización completa para enviar los cambios acumulados.

---

## 6. 🌐 Infraestructura y Despliegue en Vercel

1. **Enrutamiento SPA (`vercel.json`)**:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. **Variables de Entorno en Vercel**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **PWA en Producción**:
   - Vercel sirve los headers adecuados para Service Workers y Web Manifests con HTTPS estricto.
2. **Variables de Entorno en Producción**:
   - `VITE_SUPABASE_URL`: Endpoint HTTPS del cluster Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Token de acceso público seguro con RLS.
3. **Distribución Edge**: Certificado SSL automático y soporte completo para instalación PWA y funcionamiento offline mediante Workbox.

---

## 5. 💬 Nuevos Strings de Sincronización (`STRINGS`)
## 7. 💬 Tabla de Textos de Sincronización y Auth (`STRINGS`)

| Clave | Texto en Español (Voseo) | Uso |
| Clave | Texto en Español (Voseo) | Rol / Ubicación |
|---|---|---|
| `SYNC_STATUS_SYNCED` | Sincronizado | Header (badge verde) |
| `SYNC_STATUS_SYNCING` | Sincronizando... | Header (badge azul) |
| `SYNC_STATUS_OFFLINE` | Sin conexión (guardado en el dispositivo) | Header (badge ámbar) |
| `SYNC_STATUS_GUEST` | Modo local (Tocá para sincronizar tus dispositivos) | Header (botón de login) |
| `SYNC_STATUS_OFFLINE` | Sin conexión | Header (badge ámbar) |
| `SYNC_STATUS_GUEST` | Sincronizar | Header (botón para abrir AuthModal) |
| `AUTH_TITLE_SIGNIN` | Iniciar Sesión | Modal de autenticación |
| `AUTH_TITLE_SIGNUP` | Crear Cuenta para Sincronizar | Modal de autenticación |
| `AUTH_EMAIL_LABEL` | Tu correo electrónico | Formulario |
| `AUTH_PASSWORD_LABEL` | Contraseña | Formulario |
| `AUTH_BUTTON_SIGNIN` | Entrar y sincronizar | Botón |
| `AUTH_BUTTON_SIGNUP` | Registrarme | Botón |
| `AUTH_BUTTON_LOGOUT` | Cerrar sesión en este dispositivo | Configuración |
| `AUTH_SUCCESS_LOGIN` | ¡Sesión iniciada! Tus gastos se están sincronizando. | Toast |
| `AUTH_SUCCESS_LOGOUT` | Cerraste sesión correctamente. | Toast |

| `AUTH_EMAIL_LABEL` | Correo electrónico | Input de email |
| `AUTH_PASSWORD_LABEL` | Contraseña (mínimo 6 caracteres) | Input de contraseña |
| `AUTH_BUTTON_SIGNIN` | Entrar y sincronizar | Botón submit |
| `AUTH_BUTTON_SIGNUP` | Crear cuenta y sincronizar | Botón submit |
| `AUTH_BUTTON_LOGOUT` | Cerrar sesión en este dispositivo | Botón destructivo |
| `AUTH_SUCCESS_LOGIN` | ¡Sesión iniciada! Tus gastos se están sincronizando. | Notificación toast |
| `AUTH_SUCCESS_LOGOUT` | Cerraste sesión correctamente. | Notificación toast |
| `AUTH_SWITCH_TO_SIGNUP` | ¿No tenés cuenta todavía? Creala en un toque | Enlace selector |
| `AUTH_SWITCH_TO_SIGNIN` | ¿Ya tenés cuenta? Iniciá sesión acá | Enlace selector |
| `AUTH_ERROR_GENERIC` | Ocurrió un error al autenticar. Verificá los datos. | Mensaje de error |
| `AUTH_SUBTITLE` | Accedé al mismo historial en tu celular, computadora y tablet en tiempo real. | Subtítulo explicativo |

*Fin de la Especificación de Sincronización — DelaySpend v1.5.0*
