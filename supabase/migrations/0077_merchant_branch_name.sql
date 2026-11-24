alter table public.merchant_accounts
  add column branch_name text check (branch_name is null or char_length(btrim(branch_name)) between 1 and 120);

grant insert (branch_name), update (branch_name) on public.merchant_accounts to authenticated;

create function public.publish_merchant_branch_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.merchant_stores
    where store_id = new.self_store_id and merchant_id = new.user_id for share;
  if found then
    -- Retain the original name of an existing pin that was already named independently.
    update public.stores
      set name = concat_ws(' ', new.name, new.branch_name)
      where id = new.self_store_id
        and name in (old.name, new.name, concat_ws(' ', old.name, old.branch_name))
        and name is distinct from concat_ws(' ', new.name, new.branch_name);
  end if;
  return new;
end;
$$;

create trigger publish_merchant_branch_name
  after update of branch_name, name, self_store_id on public.merchant_accounts
  for each row execute function public.publish_merchant_branch_name();

revoke all on function public.publish_merchant_branch_name() from public, anon, authenticated;

notify pgrst, 'reload schema';
