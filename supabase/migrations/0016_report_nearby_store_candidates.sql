-- Let authenticated reporters identify an existing store immediately after
-- capturing GPS, using the same duplicate radius as report submission.

create or replace function public.report_nearby_store_candidates(
  user_latitude double precision,
  user_longitude double precision
)
returns table (
  store_id uuid,
  store_name text,
  store_type text,
  address text,
  province text,
  district text,
  distance_m double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    stores.id,
    stores.name,
    stores.store_type,
    stores.address,
    stores.province,
    stores.district,
    public.geo_distance_m(user_latitude, user_longitude, stores.latitude, stores.longitude)
      as distance_m
  from public.stores as stores
  cross join public.admin_settings as settings
  where settings.id = true
    and stores.is_active = true
    and user_latitude between -90 and 90
    and user_longitude between -180 and 180
    and stores.latitude between
      user_latitude - (settings.duplicate_radius_m::double precision / 111000)
      and user_latitude + (settings.duplicate_radius_m::double precision / 111000)
    and stores.longitude between
      user_longitude - (
        settings.duplicate_radius_m::double precision /
        (111000 * greatest(abs(cos(radians(user_latitude))), 0.1))
      )
      and user_longitude + (
        settings.duplicate_radius_m::double precision /
        (111000 * greatest(abs(cos(radians(user_latitude))), 0.1))
      )
    and public.geo_distance_m(
      user_latitude,
      user_longitude,
      stores.latitude,
      stores.longitude
    ) <= settings.duplicate_radius_m
  order by distance_m
  limit 3;
$$;

revoke all on function public.report_nearby_store_candidates(double precision, double precision)
  from public, anon;
grant execute on function public.report_nearby_store_candidates(double precision, double precision)
  to authenticated;
