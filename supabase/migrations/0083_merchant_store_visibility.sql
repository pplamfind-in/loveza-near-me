alter table public.stores add column hidden_by_merchant boolean not null default false;

create function public.merchant_store_visibility()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select s.is_active
  from public.merchant_accounts a
  join public.merchant_stores m on m.merchant_id = a.user_id and m.store_id = a.self_store_id
  join public.stores s on s.id = m.store_id
  where a.user_id = auth.uid() and (s.is_active or s.hidden_by_merchant);
$$;

create function public.set_merchant_store_visibility(visible boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  pin uuid;
begin
  if visible is null then return false; end if;

  select self_store_id into pin from public.merchant_accounts
    where user_id = auth.uid() for share;
  if pin is null then return false; end if;

  perform 1 from public.merchant_stores
    where merchant_id = auth.uid() and store_id = pin for share;
  if not found then return false; end if;

  update public.stores
    set is_active = visible, hidden_by_merchant = not visible, updated_at = clock_timestamp()
    where id = pin and (is_active or hidden_by_merchant);
  return found;
end;
$$;

revoke all on function public.merchant_store_visibility() from public, anon;
revoke all on function public.set_merchant_store_visibility(boolean) from public, anon;
grant execute on function public.merchant_store_visibility() to authenticated;
grant execute on function public.set_merchant_store_visibility(boolean) to authenticated;

notify pgrst, 'reload schema';
