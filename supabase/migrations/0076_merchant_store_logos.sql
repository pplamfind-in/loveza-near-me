alter table public.merchant_accounts add column logo_path text;
alter table public.stores add column merchant_logo_path text;

grant insert (logo_path), update (logo_path) on public.merchant_accounts to authenticated;

create function public.validate_merchant_logo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.logo_path is not null and (
    new.logo_path !~ ('^' || new.user_id::text || '/[0-9a-f-]{36}[.]webp$')
    or not exists (
      select 1 from storage.objects where bucket_id = 'store-logos' and name = new.logo_path
    )
  ) then
    raise exception 'Invalid merchant logo';
  end if;
  return new;
end;
$$;

create trigger validate_merchant_logo
  before insert or update of logo_path on public.merchant_accounts
  for each row execute function public.validate_merchant_logo();

create function public.publish_merchant_logo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.merchant_stores
    where store_id = new.self_store_id and merchant_id = new.user_id for share;
  if found then
    update public.stores set merchant_logo_path = new.logo_path
      where id = new.self_store_id and merchant_logo_path is distinct from new.logo_path;
  end if;
  return new;
end;
$$;

create trigger publish_merchant_logo
  after update of logo_path, self_store_id on public.merchant_accounts
  for each row execute function public.publish_merchant_logo();

create function public.unpublish_revoked_merchant_logo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.stores set merchant_logo_path = null
    where id = old.store_id and split_part(merchant_logo_path, '/', 1) = old.merchant_id::text;
  return old;
end;
$$;

create trigger unpublish_revoked_merchant_logo after delete on public.merchant_stores
  for each row execute function public.unpublish_revoked_merchant_logo();

revoke all on function public.validate_merchant_logo() from public, anon, authenticated;
revoke all on function public.publish_merchant_logo() from public, anon, authenticated;
revoke all on function public.unpublish_revoked_merchant_logo() from public, anon, authenticated;

create or replace function public.can_remove_store_logo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(object_name, '/', 1) = auth.uid()::text
    and not exists (select 1 from public.reports where store_logo_path = object_name)
    and not exists (select 1 from public.merchant_accounts where logo_path = object_name)
    and not exists (
      select 1 from public.stores where logo_path = object_name or merchant_logo_path = object_name
    );
$$;

notify pgrst, 'reload schema';
