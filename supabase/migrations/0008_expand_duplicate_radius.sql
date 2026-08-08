-- Expand the configurable duplicate radius from 50-100 metres to 10 metres-15 kilometres.

alter table public.admin_settings
  drop constraint if exists admin_settings_duplicate_radius_m_check;

alter table public.admin_settings
  add constraint admin_settings_duplicate_radius_m_check
  check (duplicate_radius_m between 10 and 15000);

drop policy if exists "admin_settings_update_admin" on public.admin_settings;
create policy "admin_settings_update_admin" on public.admin_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and duplicate_radius_m between 10 and 15000);

create or replace function public.submit_store_report(
  p_store_name text,
  p_address text,
  p_province text,
  p_district text,
  p_latitude double precision,
  p_longitude double precision,
  p_flavors text[],
  p_stock_status text,
  p_estimated_quantity integer,
  p_photo_url text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  radius_m integer;
  duplicate_row record;
  new_report_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_store_name), '') is null
    or nullif(trim(p_province), '') is null
    or nullif(trim(p_district), '') is null
    or p_latitude not between -90 and 90
    or p_longitude not between -180 and 180 then
    raise exception 'Invalid report data';
  end if;

  select duplicate_radius_m into radius_m
  from public.admin_settings
  where id = true;

  radius_m := coalesce(radius_m, 75);

  -- Serialize this short critical section so simultaneous nearby reports cannot both pass.
  perform pg_advisory_xact_lock(hashtext('loveza-store-report'));

  select candidate.name, candidate.distance_m
  into duplicate_row
  from (
    select
      stores.name,
      public.geo_distance_m(p_latitude, p_longitude, stores.latitude, stores.longitude) as distance_m
    from public.stores
    where stores.is_active = true
      and stores.latitude between
        p_latitude - (radius_m::double precision / 111000)
        and p_latitude + (radius_m::double precision / 111000)
      and stores.longitude between
        p_longitude - (
          radius_m::double precision /
          (111000 * greatest(abs(cos(radians(p_latitude))), 0.1))
        )
        and p_longitude + (
          radius_m::double precision /
          (111000 * greatest(abs(cos(radians(p_latitude))), 0.1))
        )

    union all

    select
      reports.store_name as name,
      public.geo_distance_m(p_latitude, p_longitude, reports.latitude, reports.longitude) as distance_m
    from public.reports
    where reports.approval_status = 'pending'
  ) as candidate
  where candidate.distance_m <= radius_m
  order by candidate.distance_m
  limit 1;

  if found then
    return jsonb_build_object(
      'duplicate', true,
      'duplicateName', duplicate_row.name,
      'distanceM', round(duplicate_row.distance_m::numeric, 1),
      'radiusM', radius_m
    );
  end if;

  insert into public.reports (
    reporter_id, store_name, address, province, district,
    latitude, longitude, flavors, stock_status, estimated_quantity,
    photo_url, note, approval_status
  ) values (
    current_user_id, trim(p_store_name), nullif(trim(p_address), ''), trim(p_province),
    trim(p_district), p_latitude, p_longitude, coalesce(p_flavors, '{}'),
    p_stock_status, p_estimated_quantity, p_photo_url, nullif(trim(p_note), ''), 'pending'
  ) returning id into new_report_id;

  return jsonb_build_object(
    'duplicate', false,
    'reportId', new_report_id,
    'radiusM', radius_m
  );
end;
$$;

revoke all on function public.submit_store_report(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text
) from public, anon;
grant execute on function public.submit_store_report(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text
) to authenticated;
