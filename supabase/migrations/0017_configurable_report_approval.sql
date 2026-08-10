-- Let admins choose between manual moderation and immediate publication.
-- Manual approval remains the safe default for existing and new installations.

alter table public.admin_settings
  add column if not exists require_report_approval boolean not null default true;

-- Internal publisher shared by manual admin approval and automatic approval.
-- API roles cannot execute this function directly.
create or replace function public._publish_report(
  target_report_id uuid,
  reviewer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  report_row public.reports%rowtype;
  published_store_id uuid;
begin
  select * into report_row
  from public.reports
  where id = target_report_id
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
    ) returning id into published_store_id;
  else
    published_store_id := report_row.store_id;

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
    where id = published_store_id;
  end if;

  update public.reports set
    store_id = published_store_id,
    approval_status = 'approved',
    reviewed_at = now(),
    reviewed_by = reviewer_id
  where id = target_report_id;

  return published_store_id;
end;
$$;

revoke all on function public._publish_report(uuid, uuid) from public, anon, authenticated;

-- Keep the existing admin-only manual approval entry point.
create or replace function public.approve_report(report_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return public._publish_report(report_id, auth.uid());
end;
$$;

revoke all on function public.approve_report(uuid) from public, anon;
grant execute on function public.approve_report(uuid) to authenticated;

-- Apply the current moderation mode inside the same transaction that creates
-- the report, so immediate mode never leaves a visible report half-published.
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
  published_store_id uuid;
  approval_required boolean;
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

    select coalesce(settings.require_report_approval, true)
    into approval_required
    from public.admin_settings as settings
    where settings.id = true;

    approval_required := coalesce(approval_required, true);

    if not approval_required then
      published_store_id := public._publish_report(report_id, null);
      result := result || jsonb_build_object(
        'autoApproved', true,
        'storeId', published_store_id
      );
    else
      result := result || jsonb_build_object('autoApproved', false);
    end if;
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
