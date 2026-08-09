-- Capture the kind of retailer where Loveza was found and carry it from a
-- report into the canonical store after an admin approves the report.

alter table public.reports
  add column if not exists store_type text not null default 'unknown'
    check (store_type in (
      'general', 'seven_eleven', 'cj_more', 'lotus_go_fresh',
      'mini_big_c', 'tops_daily', 'other', 'unknown'
    ));

alter table public.stores
  add column if not exists store_type text not null default 'unknown'
    check (store_type in (
      'general', 'seven_eleven', 'cj_more', 'lotus_go_fresh',
      'mini_big_c', 'tops_daily', 'other', 'unknown'
    ));

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
  if p_store_type not in (
    'general', 'seven_eleven', 'cj_more', 'lotus_go_fresh',
    'mini_big_c', 'tops_daily', 'other', 'unknown'
  ) then
    raise exception 'Invalid store type';
  end if;

  result := public.submit_store_report(
    p_store_name,
    p_address,
    p_province,
    p_district,
    p_latitude,
    p_longitude,
    p_flavors,
    p_stock_status,
    p_estimated_quantity,
    p_photo_url,
    p_note,
    p_store_id
  );

  if coalesce((result ->> 'duplicate')::boolean, false) = false
    and result ? 'reportId' then
    report_id := (result ->> 'reportId')::uuid;

    update public.reports
    set store_type = p_store_type
    where id = report_id
      and reporter_id = auth.uid();
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
