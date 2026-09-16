-- Crear tabla periods para ciclos y cortes de rendición
create table if not exists public.periods (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date not null,
  end_date date, -- null indica que es el período abierto y actualmente activo
  initial_income numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- Soft-delete para propagación en tiempo real
);

-- Índices de consulta rápida
create index if not exists idx_periods_user_start on public.periods(user_id, start_date desc);
create index if not exists idx_periods_user_updated on public.periods(user_id, updated_at desc);

-- Políticas de Seguridad Row Level Security (RLS)
alter table public.periods enable row level security;

create policy "Users can view their own periods"
  on public.periods for select
  using (auth.uid() = user_id);

create policy "Users can insert their own periods"
  on public.periods for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own periods"
  on public.periods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own periods"
  on public.periods for delete
  using (auth.uid() = user_id);

-- Habilitar Supabase Realtime para la tabla periods
alter publication supabase_realtime add table public.periods;

