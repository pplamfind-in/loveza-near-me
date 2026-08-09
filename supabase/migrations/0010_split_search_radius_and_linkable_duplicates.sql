-- Split the public nearby-search radius out of the duplicate-guard radius,
-- and let a report submission link to an existing store it collides with
-- instead of being hard-blocked.

-- 1) New independent column for the public "Loveza ใกล้ฉัน" search radius.
--    Defaults much larger than the tight duplicate-guard default (75m):
--    it's a user-facing "find stores near me" distance, not a collision check.
alter table public.admin_settings
  add column if not exists search_radius_m integer not null default 5000
    check (search_radius_m between 500 and 50000);

-- 2) RLS: admins may update both radii independently, each within its own range.
drop policy if exists "admin_settings_update_admin" on public.admin_settings;
create policy "admin_settings_update_admin" on public.admin_settings
  for update to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and duplicate_radius_m between 10 and 15000
    and search_radius_m between 500 and 50000
  );

-- 3) Public nearby-search radius now reads the new column.
create or replace function public.nearby_search_radius_m()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select settings.search_radius_m from public.admin_settings as settings where settings.id = true),
    5000
  );
$$;

revoke all on function public.nearby_search_radius_m() from public;
grant execute on function public.nearby_search_radius_m() to anon, authenticated;

-- 4) submit_store_report gains an optional p_store_id parameter. Adding a
--    parameter changes the function's identity (arg list), so the old
--    11-arg overload must be dropped explicitly -- otherwise PostgREST ends
--    up with two candidate overloads for the same named-arg RPC call and
--    errors with "could not choose the best candidate function".
drop function if exists public.submit_store_report(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text
);

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
  p_note text,
  p_store_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  radius_m integer;
  pending_duplicate record;
  store_duplicate record;
  confirmed_store record;
  resolved_store_id uuid;
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

  -- (a) Pending-report collisions always hard-block: there is no approved
  -- store yet to link to, so nothing is safe to confirm against.
  select candidate.name, candidate.distance_m
  into pending_duplicate
  from (
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
      'resolvable', false,
      'duplicateName', pending_duplicate.name,
      'distanceM', round(pending_duplicate.distance_m::numeric, 1),
      'radiusM', radius_m
    );
  end if;

  resolved_store_id := null;

  if p_store_id is not null then
    -- Caller claims this is a fresh sighting of a store the duplicate-check
    -- already surfaced to them. This function is security definer and
    -- callable by any authenticated user, so re-validate server-side
    -- instead of trusting the client: the store must exist, be active, and
    -- still be within the duplicate radius of the *submitted* coordinates.
    select stores.id, stores.name,
      public.geo_distance_m(p_latitude, p_longitude, stores.latitude, stores.longitude) as distance_m
    into confirmed_store
    from public.stores as stores
    where stores.id = p_store_id
      and stores.is_active = true;

    if not found or confirmed_store.distance_m > radius_m then
      raise exception 'Invalid store reference';
    end if;

    resolved_store_id := confirmed_store.id;
  else
    -- (b) No confirmed store yet: look for an active store nearby and offer
    -- it back to the client as a *resolvable* duplicate instead of blocking.
    select candidate.id, candidate.name, candidate.distance_m
    into store_duplicate
    from (
      select
        stores.id,
        stores.name,
        public.geo_distance_m(p_latitude, p_longitude, stores.latitude, stores.longitude) as distance_m
      from public.stores as stores
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
    ) as candidate
    where candidate.distance_m <= radius_m
    order by candidate.distance_m
    limit 1;

    if found then
      return jsonb_build_object(
        'duplicate', true,
        'resolvable', true,
        'storeId', store_duplicate.id,
        'duplicateName', store_duplicate.name,
        'distanceM', round(store_duplicate.distance_m::numeric, 1),
        'radiusM', radius_m
      );
    end if;
  end if;

  insert into public.reports (
    reporter_id, store_id, store_name, address, province, district,
    latitude, longitude, flavors, stock_status, estimated_quantity,
    photo_url, note, approval_status
  ) values (
    current_user_id, resolved_store_id, trim(p_store_name), nullif(trim(p_address), ''), trim(p_province),
    trim(p_district), p_latitude, p_longitude, coalesce(p_flavors, '{}'),
    p_stock_status, p_estimated_quantity, p_photo_url, nullif(trim(p_note), ''), 'pending'
  ) returning id into new_report_id;

  return jsonb_build_object(
    'duplicate', false,
    'reportId', new_report_id,
    'storeId', resolved_store_id,
    'radiusM', radius_m
  );
end;
$$;

revoke all on function public.submit_store_report(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, uuid
) from public, anon;
grant execute on function public.submit_store_report(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, uuid
) to authenticated;
