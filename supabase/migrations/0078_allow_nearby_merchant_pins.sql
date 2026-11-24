create function public.register_merchant_store(
  pin_latitude double precision, pin_longitude double precision, pin_province text, allow_nearby boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  merchant public.merchant_accounts%rowtype;
  found_store uuid;
  store_type_code text;
  radius_m integer;
begin
  if pin_latitude is null or pin_latitude not between 5 and 21
    or pin_longitude is null or pin_longitude not between 97 and 106
    or nullif(btrim(pin_province), '') is null or char_length(pin_province) > 80 then
    return 'invalid';
  end if;

  select * into merchant from public.merchant_accounts
    where user_id = auth.uid() for update;
  if not found then return 'missing-settings'; end if;
  if merchant.self_store_id is not null then return 'already-registered'; end if;

  select store_types.code into store_type_code from public.store_types
    where code = merchant.store_type_code and is_active;
  store_type_code := coalesce(store_type_code, 'general');

  -- Serialize the proximity check with public store reports.
  perform pg_advisory_xact_lock(hashtext('loveza-store-report'));
  select coalesce(duplicate_radius_m, 75) into radius_m
    from public.admin_settings where id = true;
  radius_m := coalesce(radius_m, 75);

  if allow_nearby is not true then
    select stores.id into found_store
    from public.stores
    where stores.is_active
      and stores.latitude between pin_latitude - radius_m / 110000.0 and pin_latitude + radius_m / 110000.0
      and stores.longitude between pin_longitude - radius_m / 100000.0 and pin_longitude + radius_m / 100000.0
      and public.geo_distance_m(pin_latitude, pin_longitude, stores.latitude, stores.longitude) <= radius_m
    order by public.geo_distance_m(pin_latitude, pin_longitude, stores.latitude, stores.longitude)
    limit 1;

    if found_store is not null then
      perform 1 from public.merchant_stores
        where store_id = found_store and merchant_id = merchant.user_id for share;
      if not found then return 'existing-store'; end if;
    else
      if exists (
        select 1 from public.reports
        where approval_status = 'pending'
          and public.geo_distance_m(pin_latitude, pin_longitude, latitude, longitude) <= radius_m
      ) then return 'pending-pin'; end if;
    end if;
  end if;

  if found_store is null then
    insert into public.stores (name, store_type, province, latitude, longitude)
      values (merchant.name, store_type_code, btrim(pin_province), pin_latitude, pin_longitude)
      returning id into found_store;

    insert into public.merchant_stores (store_id, merchant_id)
      values (found_store, merchant.user_id);
  end if;

  update public.merchant_accounts set self_store_id = found_store where user_id = merchant.user_id;
  return 'registered';
end;
$$;

revoke all on function public.register_merchant_store(double precision, double precision, text, boolean)
  from public, anon;
grant execute on function public.register_merchant_store(double precision, double precision, text, boolean)
  to authenticated;

create or replace function public.register_merchant_store(
  pin_latitude double precision, pin_longitude double precision, pin_province text
)
returns text
language sql
security definer
set search_path = ''
as $$
  select public.register_merchant_store(pin_latitude, pin_longitude, pin_province, false);
$$;

notify pgrst, 'reload schema';
