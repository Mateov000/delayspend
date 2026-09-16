-- Permitir tipo 'income' en la tabla expenses
alter table public.expenses drop constraint if exists expenses_type_check;
alter table public.expenses add constraint expenses_type_check check (type in ('real', 'delayed', 'income'));

