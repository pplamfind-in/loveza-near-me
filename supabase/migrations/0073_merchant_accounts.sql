create table public.account_types (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kind text not null check (kind in ('hunter', 'merchant'))
);

create table public.merchant_accounts (
  user_id uuid primary key references public.account_types(user_id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  branch_request text not null default '' check (char_length(branch_request) <= 1000)
);

create table public.merchant_stores (
  store_id uuid primary key references public.stores(id) on delete cascade,
  merchant_id uuid not null references public.merchant_accounts(user_id) on delete cascade
);

create index merchant_stores_merchant_id_idx on public.merchant_stores (merchant_id, store_id);

alter table public.account_types enable row level security;
alter table public.merchant_accounts enable row level security;
alter table public.merchant_stores enable row level security;

revoke all on public.account_types, public.merchant_accounts, public.merchant_stores
  from public, anon, authenticated;
grant select, insert on public.account_types to authenticated;
grant select, insert, update (name, branch_request) on public.merchant_accounts to authenticated;
grant select on public.merchant_stores to authenticated;

create policy account_types_read_own on public.account_types for select to authenticated
  using (user_id = (select auth.uid()));
create policy account_types_choose_once on public.account_types for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy merchant_accounts_read on public.merchant_accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy merchant_accounts_insert on public.merchant_accounts for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.account_types where user_id = (select auth.uid()) and kind = 'merchant'
  ));
create policy merchant_accounts_update on public.merchant_accounts for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy merchant_stores_read on public.merchant_stores for select to authenticated
  using (merchant_id = (select auth.uid()) or (select public.is_admin()));

alter table public.stores add column last_merchant_stock_at timestamptz;

create function public.keep_newer_merchant_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.last_reported_at = old.last_merchant_stock_at
    and new.last_reported_at < old.last_merchant_stock_at then
    new.current_status := old.current_status;
    new.estimated_quantity := old.estimated_quantity;
    new.last_reported_at := old.last_reported_at;
  end if;
  return new;
end;
$$;

create trigger keep_newer_merchant_stock before update of last_reported_at on public.stores
  for each row execute function public.keep_newer_merchant_stock();

create function public.update_merchant_stock(
  target_store_id uuid, stock_status text, quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_at timestamptz;
begin
  if stock_status is null
    or stock_status not in ('available', 'low_stock', 'out_of_stock', 'unknown')
    or quantity < 0 or quantity > 999999 then
    raise exception 'Invalid stock';
  end if;

  perform 1 from public.merchant_stores
    where store_id = target_store_id and merchant_id = auth.uid() for share;
  if not found then return false; end if;

  perform 1 from public.stores where id = target_store_id and is_active for update;
  if not found then return false; end if;

  changed_at := clock_timestamp();
  update public.stores
    set current_status = stock_status,
        estimated_quantity = case when stock_status = 'out_of_stock' then 0 else quantity end,
        last_reported_at = changed_at,
        last_merchant_stock_at = changed_at,
        updated_at = changed_at
    where id = target_store_id;
  return true;
end;
$$;

create function public.set_merchant_branches(
  target_merchant_id uuid, target_store_id uuid, target_store_type text, allow_access boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if public.is_admin() is not true then
    raise exception 'Admin access required';
  end if;
  if (target_store_id is null) = (target_store_type is null)
     or allow_access is null
     or target_store_type in ('general', 'other', 'unknown') then
    raise exception 'Choose one store or a specific chain';
  end if;

  if allow_access then
    insert into public.merchant_stores (merchant_id, store_id)
      select target_merchant_id, stores.id from public.stores
      where stores.is_active
        and (stores.id = target_store_id or stores.store_type = target_store_type)
      on conflict (store_id) do nothing;
  else
    delete from public.merchant_stores as link using public.stores
      where merchant_id = target_merchant_id and stores.id = link.store_id
        and (stores.id = target_store_id or stores.store_type = target_store_type);
  end if;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.update_merchant_stock(uuid, text, integer) from public, anon;
revoke all on function public.set_merchant_branches(uuid, uuid, text, boolean) from public, anon;
grant execute on function public.update_merchant_stock(uuid, text, integer) to authenticated;
grant execute on function public.set_merchant_branches(uuid, uuid, text, boolean) to authenticated;
