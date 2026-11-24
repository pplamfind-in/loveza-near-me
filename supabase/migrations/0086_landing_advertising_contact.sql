alter table public.admin_settings
  add column landing_advertising_contact_enabled boolean not null default false;

create function public.get_landing_advertising_contact_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select landing_advertising_contact_enabled from public.admin_settings where id = true),
    false
  );
$$;

revoke all on function public.get_landing_advertising_contact_enabled() from public;
grant execute on function public.get_landing_advertising_contact_enabled() to anon, authenticated;
notify pgrst, 'reload schema';
