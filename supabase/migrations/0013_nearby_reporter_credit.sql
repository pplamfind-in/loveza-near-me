-- Expose only a privacy-safe reporter credit for active stores.

create or replace function public.nearby_store_reporter_credits(store_ids uuid[])
returns table (
  store_id uuid,
  reporter_display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (reports.store_id)
    reports.store_id,
    case
      when nullif(btrim(profiles.display_name), '') is null then 'นักล่า Loveza'
      when cardinality(regexp_split_to_array(btrim(profiles.display_name), E'\\s+')) > 1
        then (regexp_split_to_array(btrim(profiles.display_name), E'\\s+'))[1] || ' ***'
      else btrim(profiles.display_name)
    end as reporter_display_name
  from public.reports as reports
  inner join public.stores as stores
    on stores.id = reports.store_id
    and stores.is_active = true
  left join public.profiles as profiles
    on profiles.id = reports.reporter_id
  where reports.store_id = any(coalesce(store_ids, array[]::uuid[]))
    and reports.approval_status = 'approved'
  order by reports.store_id, reports.created_at desc;
$$;

revoke all on function public.nearby_store_reporter_credits(uuid[]) from public;
grant execute on function public.nearby_store_reporter_credits(uuid[]) to anon, authenticated;
