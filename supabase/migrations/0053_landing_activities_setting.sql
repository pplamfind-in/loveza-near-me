alter table public.admin_settings
  add column landing_activities_enabled boolean not null default true;

create function public.get_landing_activities_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select landing_activities_enabled from public.admin_settings where id = true),
    true
  );
$$;

revoke all on function public.get_landing_activities_enabled() from public;
grant execute on function public.get_landing_activities_enabled() to anon, authenticated;
