alter table public.stores
  add column merchant_stock_by_flavor jsonb not null default '{}'
  check (jsonb_typeof(merchant_stock_by_flavor) = 'object');

create or replace function public.update_merchant_stock(
  target_store_id uuid, stock_status text, quantity integer, flavors text[]
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
    or quantity < 0 or quantity > 999999
    or cardinality(flavors) > 5 or array_position(flavors, null) is not null
    or not flavors <@ array['honey_lemon', 'lychee', 'kyoho_grape', 'yoghurt', 'unknown'] then
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
        merchant_stock_flavors = case when stock_status = 'out_of_stock' then '{}'::text[]
                                      else coalesce(flavors, '{}'::text[]) end,
        merchant_stock_by_flavor = '{}'::jsonb,
        last_reported_at = changed_at,
        last_merchant_stock_at = changed_at,
        updated_at = changed_at
    where id = target_store_id;
  return true;
end;
$$;

create function public.update_merchant_flavor_stock(
  target_store_id uuid, flavor text, stock_status text, quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  store_row public.stores%rowtype;
  breakdown jsonb;
  changed_at timestamptz;
  total_quantity integer;
  summary_status text;
  flavors text[];
begin
  if flavor is null or flavor not in ('honey_lemon', 'lychee', 'kyoho_grape', 'yoghurt')
    or stock_status is null or stock_status not in ('available', 'low_stock', 'out_of_stock', 'unknown')
    or quantity < 0 or quantity > 999999 then
    raise exception 'Invalid stock';
  end if;

  perform 1 from public.merchant_stores
    where store_id = target_store_id and merchant_id = auth.uid() for share;
  if not found then return false; end if;

  select * into store_row from public.stores
    where id = target_store_id and is_active for update;
  if not found then return false; end if;

  breakdown := store_row.merchant_stock_by_flavor;
  if breakdown = '{}'::jsonb and store_row.last_merchant_stock_at = store_row.last_reported_at then
    select coalesce(jsonb_object_agg(name, jsonb_build_object(
      'status', store_row.current_status, 'quantity', null, 'updated_at', store_row.last_merchant_stock_at
    )), '{}') into breakdown
    from unnest(store_row.merchant_stock_flavors) as existing(name)
    where name in ('honey_lemon', 'lychee', 'kyoho_grape', 'yoghurt');
  end if;

  changed_at := clock_timestamp();
  if quantity = 0 or stock_status = 'out_of_stock' then
    stock_status := 'out_of_stock';
    quantity := 0;
  end if;

  breakdown := jsonb_set(breakdown, array[flavor], jsonb_build_object(
    'status', stock_status, 'quantity', quantity, 'updated_at', changed_at
  ));

  select
    case
      when bool_or(value->>'status' = 'available') then 'available'
      when bool_or(value->>'status' = 'low_stock') then 'low_stock'
      when bool_or(value->>'status' = 'unknown') then 'unknown'
      else 'out_of_stock'
    end,
    case when bool_and(value->>'quantity' is not null) then sum((value->>'quantity')::integer) end,
    coalesce(array_agg(key order by key) filter (where value->>'status' <> 'out_of_stock'), '{}')
  into summary_status, total_quantity, flavors
  from jsonb_each(breakdown);

  update public.stores
    set current_status = summary_status,
        estimated_quantity = total_quantity,
        merchant_stock_by_flavor = breakdown,
        merchant_stock_flavors = flavors,
        last_reported_at = changed_at,
        last_merchant_stock_at = changed_at,
        updated_at = changed_at
    where id = target_store_id;
  return true;
end;
$$;

revoke all on function public.update_merchant_flavor_stock(uuid, text, text, integer) from public, anon;
grant execute on function public.update_merchant_flavor_stock(uuid, text, text, integer) to authenticated;

notify pgrst, 'reload schema';
