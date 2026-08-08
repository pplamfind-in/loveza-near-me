-- Connect reports to authenticated Google users and add nearby-store queries.

alter table public.profiles
  add column if not exists email text;

alter table public.reports
  add column if not exists reporter_id uuid references auth.users(id) on delete set null,
  add column if not exists estimated_quantity integer
    check (estimated_quantity is null or estimated_quantity >= 0);

alter table public.stores
  add column if not exists estimated_quantity integer
    check (estimated_quantity is null or estimated_quantity >= 0);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

-- Keep a minimal public profile in sync with every Supabase Auth identity.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    role = case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data, raw_app_meta_data
  on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, display_name, email, role)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name',
    split_part(coalesce(email, ''), '@', 1)
  ),
  email,
  case when raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'user' end
from auth.users
on conflict (id) do update set
  display_name = excluded.display_name,
  email = excluded.email,
  role = case
    when excluded.role = 'admin' then 'admin'
    else public.profiles.role
  end;

-- Admin authorization supports both Auth app_metadata and the profiles table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
    or exists (
      select 1
      from public.profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

-- A report must belong to the signed-in user and always starts pending.
drop policy if exists "reports_insert_anyone" on public.reports;
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert to authenticated
  with check (
    auth.uid() is not null
    and reporter_id = auth.uid()
    and approval_status = 'pending'
  );

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'user');

-- Uploads live under report-images/{user-id}/... and require a session.
drop policy if exists "report_images_anyone_insert" on storage.objects;
drop policy if exists "report_images_authenticated_insert" on storage.objects;
create policy "report_images_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Distance calculation stays in Postgres so clients only receive nearby rows.
create or replace function public.nearby_stores(
  user_latitude double precision,
  user_longitude double precision,
  radius_km double precision default 25
)
returns table (
  id uuid,
  name text,
  address text,
  province text,
  district text,
  subdistrict text,
  latitude double precision,
  longitude double precision,
  current_status text,
  estimated_quantity integer,
  last_reported_at timestamptz,
  distance_km double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    stores.id,
    stores.name,
    stores.address,
    stores.province,
    stores.district,
    stores.subdistrict,
    stores.latitude,
    stores.longitude,
    stores.current_status,
    stores.estimated_quantity,
    stores.last_reported_at,
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(user_latitude))
        * cos(radians(stores.latitude))
        * cos(radians(stores.longitude) - radians(user_longitude))
        + sin(radians(user_latitude)) * sin(radians(stores.latitude))
      ))
    ) as distance_km
  from public.stores
  where stores.is_active = true
    and 6371 * acos(
      least(1, greatest(-1,
        cos(radians(user_latitude))
        * cos(radians(stores.latitude))
        * cos(radians(stores.longitude) - radians(user_longitude))
        + sin(radians(user_latitude)) * sin(radians(stores.latitude))
      ))
    ) <= greatest(radius_km, 0)
  order by distance_km asc;
$$;

grant execute on function public.nearby_stores(double precision, double precision, double precision)
  to anon, authenticated;

-- Review and publish a report atomically from the admin dashboard.
create or replace function public.approve_report(report_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  report_row public.reports%rowtype;
  approved_store_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into report_row
  from public.reports
  where id = report_id
  for update;

  if not found then
    raise exception 'Report not found';
  end if;

  if report_row.store_id is null then
    insert into public.stores (
      name, address, province, district, subdistrict,
      latitude, longitude, current_status, estimated_quantity,
      last_reported_at
    ) values (
      report_row.store_name, report_row.address, report_row.province,
      report_row.district, report_row.subdistrict,
      report_row.latitude, report_row.longitude, report_row.stock_status,
      report_row.estimated_quantity, report_row.created_at
    ) returning id into approved_store_id;
  else
    approved_store_id := report_row.store_id;

    update public.stores set
      name = report_row.store_name,
      address = report_row.address,
      province = report_row.province,
      district = report_row.district,
      subdistrict = report_row.subdistrict,
      latitude = report_row.latitude,
      longitude = report_row.longitude,
      current_status = report_row.stock_status,
      estimated_quantity = report_row.estimated_quantity,
      last_reported_at = report_row.created_at,
      updated_at = now()
    where id = approved_store_id;
  end if;

  update public.reports set
    store_id = approved_store_id,
    approval_status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = report_id;

  return approved_store_id;
end;
$$;

revoke all on function public.approve_report(uuid) from public, anon;
grant execute on function public.approve_report(uuid) to authenticated;
