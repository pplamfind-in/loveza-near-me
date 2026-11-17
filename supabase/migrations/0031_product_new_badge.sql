-- Explicit, admin-controlled new-product badges on the landing page.
alter table public.products
  add column if not exists is_new boolean not null default false;

comment on column public.products.is_new is
  'Show the Pixel/Voxel NEW badge on the public product card.';

-- Feature the newly introduced yoghurt flavor; other products keep their setting.
update public.products
set is_new = true
where lower(slug) in ('yoghurt', 'yogurt')
   or lower(name) in ('yoghurt', 'yogurt');
