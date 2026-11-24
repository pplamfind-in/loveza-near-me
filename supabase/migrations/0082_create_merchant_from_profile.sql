create function public.create_merchant_from_profile(
  shop_name text, shop_branch text, shop_type text, shop_logo text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  account_kind text;
begin
  select kind into account_kind from public.account_types
    where user_id = owner_id for update;
  if account_kind is distinct from 'hunter' then return false; end if;

  if shop_type is not null then
    select name into shop_name from public.store_types where code = shop_type and is_active;
  end if;
  if shop_name is null or char_length(btrim(shop_name)) not between 1 and 120
    or char_length(shop_branch) > 120 then
    raise exception 'Invalid merchant settings';
  end if;

  insert into public.merchant_accounts (user_id, name, branch_name, store_type_code, logo_path)
    values (owner_id, btrim(shop_name), shop_branch, shop_type, shop_logo)
    on conflict (user_id) do nothing;
  if not found then return false; end if;

  update public.account_types set kind = 'merchant' where user_id = owner_id;
  return true;
end;
$$;

revoke all on function public.create_merchant_from_profile(text, text, text, text) from public, anon;
grant execute on function public.create_merchant_from_profile(text, text, text, text) to authenticated;
notify pgrst, 'reload schema';
