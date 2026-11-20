alter table public.reports add column store_logo_path text;
alter table public.stores add column logo_path text;

-- Logo references are assigned by the submission RPC after ownership checks.
create policy "reports_require_validated_logo" on public.reports
  as restrictive for insert to authenticated with check (store_logo_path is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-logos', 'store-logos', true, 2097152, array['image/webp']);

create policy "store_logos_upload_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function public.can_remove_store_logo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(object_name, '/', 1) = auth.uid()::text
    and not exists (select 1 from public.reports where store_logo_path = object_name)
    and not exists (select 1 from public.stores where logo_path = object_name);
$$;

revoke all on function public.can_remove_store_logo(text) from public, anon;
grant execute on function public.can_remove_store_logo(text) to authenticated;

create policy "store_logos_read_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'store-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "store_logos_remove_unused" on storage.objects
  for delete to authenticated using (
    bucket_id = 'store-logos' and public.can_remove_store_logo(name)
  );

-- A pending report can carry the logo without exposing it in store selection.
-- Immediate approval and later manual approval both publish it to the store.
create or replace function public.publish_report_store_logo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stores
  set logo_path = new.store_logo_path
  where id = new.store_id and store_type = 'other' and logo_path is null;

  return new;
end;
$$;

revoke all on function public.publish_report_store_logo() from public, anon, authenticated;

create trigger publish_report_store_logo
after update of approval_status, store_logo_path on public.reports
for each row when (
  new.approval_status = 'approved' and new.store_id is not null
  and new.store_logo_path is not null and new.store_type = 'other'
)
execute function public.publish_report_store_logo();

create or replace function public.submit_store_report_with_logo(
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
  p_logo_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null
    or p_logo_path is null
    or p_logo_path !~ ('^' || auth.uid()::text || '/[0-9a-f-]{36}[.]webp$')
    or not exists (
      select 1 from storage.objects where bucket_id = 'store-logos' and name = p_logo_path
    )
  then
    raise exception 'Invalid store logo';
  end if;

  result := public.submit_store_report_v2(
    p_store_name, 'other', p_address, p_province, p_district,
    p_latitude, p_longitude, p_flavors, p_stock_status,
    p_estimated_quantity, p_photo_url, p_note, null
  );

  if coalesce((result ->> 'duplicate')::boolean, false) = false and result ? 'reportId' then
    update public.reports
    set store_logo_path = p_logo_path
    where id = (result ->> 'reportId')::uuid and reporter_id = auth.uid();
  end if;

  return result;
end;
$$;

revoke all on function public.submit_store_report_with_logo(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, text
) from public, anon;
grant execute on function public.submit_store_report_with_logo(
  text, text, text, text, double precision, double precision,
  text[], text, integer, text, text, text
) to authenticated;
