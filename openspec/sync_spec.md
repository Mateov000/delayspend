# Especificación Técnica — Sincronización Multi-Dispositivo y Nube (DelaySpend)

**Documento:** `openspec/sync_spec.md`  
**Versión:** 1.0.0 · **Estado:** Propuesta de Arquitectura  
**Metodología:** OpenSpec / ChangeSpec  

---

## 1. 🎯 Diagnóstico y Justificación Arquitectónica

### El Desafío
DelaySpend nació como una PWA 100% cliente que persiste su estado en el `localStorage` del navegador. Si bien esto garantiza máxima velocidad y privacidad inicial, presenta una limitación fundamental:
- Si el usuario carga un gasto en su **teléfono celular**, ese gasto **no existe en su computadora** ni en su tablet.
- Si el usuario borra la memoria caché del navegador o cambia de teléfono, corre el riesgo de perder el historial si no exportó previamente.

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

---

## 2. 🗄️ Modelo de Datos y Esquema PostgreSQL (Supabase)

```sql
-- Tabla principal de movimientos sincronizados
create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('real', 'delayed')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category_id text not null,
  date date not null,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft delete para propagar borrados a otros dispositivos
);

-- Índices de alto rendimiento
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_expenses_user_updated on public.expenses(user_id, updated_at desc);

-- Políticas de Seguridad RLS
alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Habilitar replicación en tiempo real para la tabla
alter publication supabase_realtime add table public.expenses;
```

---

## 3. 🔄 Estrategia de Sincronización (Sync Engine)

```
[Dispositivo Móvil]                   [Supabase Cloud]                    [Computadora / Laptop]
      │                                      │                                       │
  (Nuevo Gasto)                              │                                       │
      ├──── 1. Guarda en localStorage (0ms)   │                                       │
      │        y actualiza UI en vivo        │                                       │
      │                                      │                                       │
      ├──── 2. POST / Upsert en background ─►│                                       │
      │                                      ├───── 3. Evento Realtime (WebSocket) ─►│
      │                                      │                                       ├──── 4. Actualiza Zustand +
      │                                      │                                       │        localStorage local
      ▼                                      ▼                                       ▼
```

### Reglas de Conflicto y Resolución:
- **Last-Write-Wins (LWW) basado en `updatedAt`**: Si un gasto se edita en dos dispositivos en simultáneo, prevalece la versión con timestamp `updated_at` más reciente.
- **Borrados con Soft-Delete**: Para evitar que un dispositivo desconectado vuelva a resucitar un gasto borrado en otro dispositivo, los borrados se marcan inicialmente con `deleted_at = now()` y se propagan antes de la purga física.
- **Migración inicial sin pérdida de datos**: Si el usuario ya venía usando la app en su celular con datos en `localStorage` y luego inicia sesión, el Sync Engine toma esos datos locales y los sube a Supabase automáticamente.

---

## 4. 🌐 Infraestructura y Despliegue en Vercel

1. **Configuración SPA (`vercel.json`)**:
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

---

## 5. 💬 Nuevos Strings de Sincronización (`STRINGS`)

| Clave | Texto en Español (Voseo) | Uso |
|---|---|---|
| `SYNC_STATUS_SYNCED` | Sincronizado | Header (badge verde) |
| `SYNC_STATUS_SYNCING` | Sincronizando... | Header (badge azul) |
| `SYNC_STATUS_OFFLINE` | Sin conexión (guardado en el dispositivo) | Header (badge ámbar) |
| `SYNC_STATUS_GUEST` | Modo local (Tocá para sincronizar tus dispositivos) | Header (botón de login) |
| `AUTH_TITLE_SIGNIN` | Iniciar Sesión | Modal de autenticación |
| `AUTH_TITLE_SIGNUP` | Crear Cuenta para Sincronizar | Modal de autenticación |
| `AUTH_EMAIL_LABEL` | Tu correo electrónico | Formulario |
| `AUTH_PASSWORD_LABEL` | Contraseña | Formulario |
| `AUTH_BUTTON_SIGNIN` | Entrar y sincronizar | Botón |
| `AUTH_BUTTON_SIGNUP` | Registrarme | Botón |
| `AUTH_BUTTON_LOGOUT` | Cerrar sesión en este dispositivo | Configuración |
| `AUTH_SUCCESS_LOGIN` | ¡Sesión iniciada! Tus gastos se están sincronizando. | Toast |
| `AUTH_SUCCESS_LOGOUT` | Cerraste sesión correctamente. | Toast |

