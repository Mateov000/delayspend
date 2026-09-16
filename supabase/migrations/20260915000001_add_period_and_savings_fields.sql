-- Migración para corte por gasto específico y ahorro extra por opción más barata

-- 1. Agregar columnas a public.expenses
alter table public.expenses
  add column if not exists period_id uuid references public.periods(id) on delete set null,
  add column if not exists saved_extra_amount numeric(12, 2) default 0,
  add column if not exists linked_expense_id uuid references public.expenses(id) on delete cascade;

-- 2. Agregar columna a public.periods
alter table public.periods
  add column if not exists cutoff_expense_id uuid references public.expenses(id) on delete set null;

-- 3. Índices de rendimiento
create index if not exists idx_expenses_user_period on public.expenses(user_id, period_id);
create index if not exists idx_expenses_linked on public.expenses(linked_expense_id);
