-- Admin-managed retailer master data and logo storage.

create table if not exists public.store_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name text not null,
  logo_url text,
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_types (code, name, sort_order, is_active)
values
  ('general', 'ร้านทั่วไป', 10, true),
  ('seven_eleven', '7-Eleven', 20, true),
  ('cj_more', 'CJ MORE', 30, true),
  ('lotus_go_fresh', 'Lotus’s go fresh', 40, true),
  ('mini_big_c', 'Mini Big C', 50, true),
  ('tops_daily', 'Tops Daily', 60, true),
  ('other', 'ร้านประเภทอื่น', 70, true),
  ('unknown', 'ไม่ระบุประเภท', 9999, false)
on conflict (code) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

-- Keep this migration safe when it is applied directly from the SQL editor
-- without running 0011 first.
alter table public.reports
  add column if not exists store_type text not null default 'unknown';
alter table public.stores
  add column if not exists store_type text not null default 'unknown';

alter table public.reports drop constraint if exists reports_store_type_check;
alter table public.stores drop constraint if exists stores_store_type_check;
alter table public.reports drop constraint if exists reports_store_type_fkey;
alter table public.stores drop constraint if exists stores_store_type_fkey;

alter table public.reports
  add constraint reports_store_type_fkey foreign key (store_type)
  references public.store_types(code) on update cascade on delete restrict;
alter table public.stores
  add constraint stores_store_type_fkey foreign key (store_type)
  references public.store_types(code) on update cascade on delete restrict;

alter table public.store_types enable row level security;

drop policy if exists "store_types_select_public" on public.store_types;
drop policy if exists "store_types_insert_admin" on public.store_types;
drop policy if exists "store_types_update_admin" on public.store_types;
drop policy if exists "store_types_delete_admin" on public.store_types;

create policy "store_types_select_public" on public.store_types
  for select using (is_active = true or public.is_admin());
create policy "store_types_insert_admin" on public.store_types
  for insert to authenticated with check (public.is_admin());
create policy "store_types_update_admin" on public.store_types
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "store_types_delete_admin" on public.store_types
  for delete to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-type-logos',
  'store-type-logos',
  true,
  2097152,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "store_type_logos_select_public" on storage.objects;
drop policy if exists "store_type_logos_insert_admin" on storage.objects;
drop policy if exists "store_type_logos_update_admin" on storage.objects;
drop policy if exists "store_type_logos_delete_admin" on storage.objects;

create policy "store_type_logos_select_public" on storage.objects
  for select using (bucket_id = 'store-type-logos');
create policy "store_type_logos_insert_admin" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'store-type-logos' and public.is_admin()
  );
create policy "store_type_logos_update_admin" on storage.objects
  for update to authenticated using (
    bucket_id = 'store-type-logos' and public.is_admin()
  );
create policy "store_type_logos_delete_admin" on storage.objects
  for delete to authenticated using (
    bucket_id = 'store-type-logos' and public.is_admin()
  );

create or replace function public.submit_store_report_v2(
  p_store_name text,
  p_store_type text,
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
  result jsonb;
  report_id uuid;
begin
  if not exists (
    select 1 from public.store_types
    where code = p_store_type and is_active = true
  ) then
    raise exception 'Invalid store type';
  end if;

  result := public.submit_store_report(
    p_store_name, p_address, p_province, p_district,
    p_latitude, p_longitude, p_flavors, p_stock_status,
    p_estimated_quantity, p_photo_url, p_note, p_store_id
  );

  if coalesce((result ->> 'duplicate')::boolean, false) = false
    and result ? 'reportId' then
    report_id := (result ->> 'reportId')::uuid;
    update public.reports
    set store_type = p_store_type
    where id = report_id and reporter_id = auth.uid();
  end if;

  return result;
end;
$$;

revoke all on function public.submit_store_report_v2(
  text, text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, uuid
) from public, anon;
grant execute on function public.submit_store_report_v2(
  text, text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, uuid
) to authenticated;

-- Carry the selected master type into the canonical store when Admin approves.
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
      name, store_type, address, province, district, subdistrict,
      latitude, longitude, current_status, estimated_quantity,
      last_reported_at
    ) values (
      report_row.store_name, report_row.store_type, report_row.address, report_row.province,
      report_row.district, report_row.subdistrict, report_row.latitude, report_row.longitude,
      report_row.stock_status, report_row.estimated_quantity, report_row.created_at
    ) returning id into approved_store_id;
  else
    approved_store_id := report_row.store_id;

    update public.stores set
      name = report_row.store_name,
      store_type = report_row.store_type,
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
