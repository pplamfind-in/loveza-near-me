alter table public.stores add column merchant_stock_flavors text[] not null default '{}';

create function public.update_merchant_stock(
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
        last_reported_at = changed_at,
        last_merchant_stock_at = changed_at,
        updated_at = changed_at
    where id = target_store_id;
  return true;
end;
$$;

revoke all on function public.update_merchant_stock(uuid, text, integer, text[]) from public, anon;
grant execute on function public.update_merchant_stock(uuid, text, integer, text[]) to authenticated;

create or replace function public.update_merchant_stock(
  target_store_id uuid, stock_status text, quantity integer
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select public.update_merchant_stock(target_store_id, stock_status, quantity, '{}'::text[]);
$$;

notify pgrst, 'reload schema';
