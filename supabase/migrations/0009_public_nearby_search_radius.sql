-- Expose only the configured radius needed by the public nearby-store search.
-- The admin_settings row and updated_by value remain protected by RLS.

create or replace function public.nearby_search_radius_m()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select settings.duplicate_radius_m from public.admin_settings as settings where settings.id = true),
    75
  );
$$;

revoke all on function public.nearby_search_radius_m() from public;
grant execute on function public.nearby_search_radius_m() to anon, authenticated;
