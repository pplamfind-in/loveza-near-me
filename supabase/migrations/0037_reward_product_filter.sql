alter table public.explorer_rewards
  add column required_product_id uuid references public.products(id) on delete restrict,
  add column required_flavor text check(required_flavor in ('honey_lemon','lychee','kyoho_grape','yoghurt')),
  add column required_product_name text;
alter table public.explorer_rewards add constraint reward_product_filter_complete check (
 (required_product_id is null and required_flavor is null and required_product_name is null)
 or (required_product_id is not null and required_flavor is not null and required_product_name is not null)
);
