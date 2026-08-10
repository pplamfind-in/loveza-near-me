-- Let admins publish a truthful acknowledgement notice without exposing the
-- rest of the protected admin_settings row to public clients.

alter table public.admin_settings
  add column if not exists brand_owner_acknowledged boolean not null default false;

create or replace function public.get_brand_owner_acknowledged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(settings.brand_owner_acknowledged, false)
  from public.admin_settings as settings
  where settings.id = true;
$$;

revoke all on function public.get_brand_owner_acknowledged() from public;
grant execute on function public.get_brand_owner_acknowledged() to anon, authenticated;
