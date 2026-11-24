alter table public.merchant_accounts
  add column store_type_code text references public.store_types(code)
    on update cascade on delete set null;

grant update (store_type_code) on public.merchant_accounts to authenticated;
