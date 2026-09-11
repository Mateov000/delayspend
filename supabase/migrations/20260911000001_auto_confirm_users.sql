-- Función para auto-confirmar el email de cualquier usuario que se registre
create or replace function public.auto_confirm_user()
returns trigger as $$
begin
  new.confirmed_at = coalesce(new.confirmed_at, now());
  new.email_confirmed_at = coalesce(new.email_confirmed_at, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que se dispara antes de insertar en auth.users
drop trigger if exists on_auth_user_created_auto_confirm on auth.users;
create trigger on_auth_user_created_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_user();

