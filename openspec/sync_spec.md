# Especificación Técnica — Motor de Sincronización Multi-Dispositivo, Cloud Backend y Autenticación (DelaySpend)

> **Documento:** `openspec/sync_spec.md`  
> **Versión:** 1.5.0 · **Estado:** Implementado y Activo en Producción  
> **Metodología:** OpenSpec / ChangeSpec

---

## 1. 🎯 Diagnóstico y Modelo Arquitectónico

### 1.1 El Desafío
DelaySpend nació como una PWA con almacenamiento en `localStorage`. Si bien otorgaba velocidad instantánea y funcionamiento offline sin costo de infraestructura, presentaba tres limitaciones críticas:
1. **Silos de datos:** Un gasto anotado en el teléfono celular en la calle no existía al abrir la computadora en casa.
2. **Riesgo de pérdida:** Limpiar cookies o restaurar el teléfono borraba el historial financiero si no se hacían exportaciones manuales frecuentes.
3. **Fricción familiar:** Al rendir cuentas a fin de ciclo, el usuario prefiere generar y revisar el informe cómodamente desde la PC de escritorio.

### 1.2 La Solución: Arquitectura Local-First Híbrida
Para resolverlo sin degradar la experiencia de 0 milisegundos ni requerir conexión a internet obligatoria para anotar un gasto:
1. **La app se mantiene 100% Offline-First:** Toda operación de guardado o edición se ejecuta inmediatamente contra Zustand y `localStorage` en 0ms.
2. **Sincronización Asíncrona en Segundo Plano:** En cuanto hay red y una sesión iniciada, el motor despacha las mutaciones hacia Supabase sin bloquear la interfaz de usuario.
3. **Replicación Bidireccional por WebSockets:** Supabase Realtime propaga las altas, ediciones y bajas entre dispositivos en menos de 1 segundo mediante el protocolo `postgres_changes`.

---

## 2. 🗄️ Esquema Relacional de Sincronización (PostgreSQL / Supabase)

El backend corre en un clúster PostgreSQL en São Paulo (`sa-east-1`, menor latencia para Sudamérica):

```sql
-- Tabla de Movimientos Financieros
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('real', 'delayed', 'income')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  period_id uuid references public.periods(id) on delete set null,
  saved_extra_amount numeric(12, 2) check (saved_extra_amount >= 0),
  nature text not null default 'daily' check (nature in ('daily', 'fixed', 'eventual', 'house')),
  tags text[],
  installment_group_id uuid,
  installment_number integer,
  installment_total integer
);

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

-- Seguridad Row Level Security (RLS)
alter table public.expenses enable row level security;
alter table public.periods enable row level security;

create policy "Users can only access their own expenses"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can only access their own periods"
  on public.periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Replicación en tiempo real habilitada
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.periods;
```

---

## 3. ⚡ Bypass de SMTP: Auto-Confirmación de Cuentas

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

Esto garantiza un registro con **fricción cero**: el usuario escribe su email y clave e inicia sesión de inmediato sin salir de la app ni consultar su bandeja de entrada.

---

## 4. 🔄 Flujo de Sincronización y Ciclo de Vida de Datos

```
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

### 4.1 Reglas de Sincronización y Merge:
1. **Last-Write-Wins (LWW) basado en `updatedAt`:** Ante un conflicto de edición simultáneo entre dos dispositivos, el servidor y los clientes eligen la entidad con el timestamp `updatedAt` más reciente.
2. **Soft Deletes con `deletedAt`:** Los registros eliminados no se borran físicamente de inmediato. Se les asigna `deleted_at = now()` para que el cambio viaje a todos los dispositivos sincronizados. Una vez replicado el borrado, el registro se descarta del almacenamiento local.
3. **Migración Transparente Local -> Nube:** Si el usuario utiliza la app de forma anónima (offline) acumulando gastos en `localStorage` y posteriormente inicia sesión o crea su cuenta, el Sync Engine toma automáticamente todos los registros locales y los migra hacia su cuenta en Supabase.

---

## 5. 🔌 Manejo de Red, Colas y Reconexión

1. **Detección de Conectividad:** El store `useSyncStore` escucha los eventos `online` y `offline` del navegador.
2. **Badge de Estado en Header:**
   - 🟢 *Sincronizado:* Todo el estado local coincide con la nube.
   - 🟡 *Sincronizando...:* Hay mutaciones en tránsito.
   - ⚪ *Sin conexión:* Operando en modo local; los cambios se guardan en la cola offline.
   - 🔵 *Sincronizar:* Usuario no autenticado (modo invitado).
3. **Drenaje Automático de Cola:** Al restablecerse la conexión a internet, se dispara una sincronización completa para enviar los cambios acumulados.

---
*Fin de la Especificación de Sincronización — DelaySpend v1.5.0*
