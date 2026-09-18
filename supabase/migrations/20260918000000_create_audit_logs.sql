-- Migration: Create audit_logs table and automatic triggers for expenses and periods

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null, -- 'INSERT', 'UPDATE', 'DELETE'
  entity_type text not null, -- 'expenses', 'periods'
  entity_id text not null,
  details jsonb, -- { old: ..., new: ... }
  created_at timestamptz not null default now()
);

-- RLS
alter table public.audit_logs enable row level security;

create policy "Users can view their own audit logs"
  on public.audit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = user_id);

create index if not exists idx_audit_logs_user_entity on public.audit_logs(user_id, entity_type, created_at desc);

-- Automatic trigger function to log all modifications
create or replace function public.log_entity_change()
returns trigger as $$
declare
  v_user_id uuid;
  v_entity_id text;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  v_entity_id := coalesce(new.id::text, old.id::text);

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details, created_at)
  values (
    v_user_id,
    tg_op,
    tg_table_name,
    v_entity_id,
    jsonb_build_object(
      'old', to_jsonb(old),
      'new', to_jsonb(new)
    ),
    now()
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Triggers on expenses
drop trigger if exists trigger_log_expenses on public.expenses;
create trigger trigger_log_expenses
  after insert or update or delete on public.expenses
  for each row execute function public.log_entity_change();

-- Triggers on periods
drop trigger if exists trigger_log_periods on public.periods;
create trigger trigger_log_periods
  after insert or update or delete on public.periods
  for each row execute function public.log_entity_change();
