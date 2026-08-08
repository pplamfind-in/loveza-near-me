-- Realtime discovery counter, configurable duplicate radius, and atomic report insertion.

create table if not exists public.admin_settings (
  id boolean primary key default true check (id),
  duplicate_radius_m integer not null default 75
    check (duplicate_radius_m between 10 and 15000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.admin_settings (id, duplicate_radius_m)
values (true, 75)
on conflict (id) do nothing;

alter table public.admin_settings enable row level security;

drop policy if exists "admin_settings_select_admin" on public.admin_settings;
create policy "admin_settings_select_admin" on public.admin_settings
  for select to authenticated using (public.is_admin());

drop policy if exists "admin_settings_update_admin" on public.admin_settings;
create policy "admin_settings_update_admin" on public.admin_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin() and duplicate_radius_m between 10 and 15000);

create or replace function public.geo_distance_m(
  latitude_a double precision,
  longitude_a double precision,
  latitude_b double precision,
  longitude_b double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select 6371000 * acos(
    least(1, greatest(-1,
      cos(radians(latitude_a)) * cos(radians(latitude_b)) *
      cos(radians(longitude_b) - radians(longitude_a)) +
      sin(radians(latitude_a)) * sin(radians(latitude_b))
    ))
  );
$$;

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

create or replace function public.admin_network_stats()
returns table (
  locations bigint,
  verified_locations bigint,
  pending_locations bigint,
  provinces bigint,
  total_stock bigint,
  duplicate_radius_m integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  with setting as (
    select coalesce(
      (select settings.duplicate_radius_m from public.admin_settings as settings where settings.id = true),
      75
    ) as radius_m
  ),
  pending_unique as (
    select reports.id, reports.province, reports.latitude, reports.longitude
    from public.reports as reports
    cross join setting
    where reports.approval_status = 'pending'
      and not exists (
        select 1
        from public.stores as stores
        where stores.is_active = true
          and public.geo_distance_m(
            reports.latitude, reports.longitude, stores.latitude, stores.longitude
          ) <= setting.radius_m
      )
      and not exists (
        select 1
        from public.reports as earlier
        where earlier.approval_status = 'pending'
          and (earlier.created_at, earlier.id) < (reports.created_at, reports.id)
          and public.geo_distance_m(
            reports.latitude, reports.longitude, earlier.latitude, earlier.longitude
          ) <= setting.radius_m
      )
  ),
  all_provinces as (
    select stores.province from public.stores as stores where stores.is_active = true
    union all
    select pending_unique.province from pending_unique
  )
  select
    (select count(*) from public.stores where is_active = true) + (select count(*) from pending_unique),
    (select count(*) from public.stores where is_active = true),
    (select count(*) from pending_unique),
    (select count(distinct all_provinces.province) from all_provinces),
    coalesce((select sum(stores.estimated_quantity) from public.stores as stores where stores.is_active = true), 0),
    (select setting.radius_m from setting);
end;
$$;

revoke all on function public.admin_network_stats() from public, anon;
grant execute on function public.admin_network_stats() to authenticated;

-- Supabase Realtime needs both tables in its publication for live counters.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
    ) then
      execute 'alter publication supabase_realtime add table public.reports';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stores'
    ) then
      execute 'alter publication supabase_realtime add table public.stores';
    end if;
  end if;
end;
$$;
