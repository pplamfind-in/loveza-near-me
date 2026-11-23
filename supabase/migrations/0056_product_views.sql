create table public.product_views (
  product_id uuid not null references public.products(id) on delete cascade,
  device_id uuid not null,
  last_counted_at timestamptz not null,
  view_count bigint not null default 1 check (view_count > 0),
  primary key (product_id, device_id)
);

alter table public.product_views enable row level security;
revoke all on public.product_views from public, anon, authenticated;

create function public.record_product_view(target_product_id uuid, viewer_device_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.product_views as views (product_id, device_id, last_counted_at)
  select id, viewer_device_id, statement_timestamp()
  from public.products
  where id = target_product_id and is_active and viewer_device_id is not null
  on conflict (product_id, device_id) do update
    set view_count = views.view_count + 1,
        last_counted_at = excluded.last_counted_at
    where views.last_counted_at <= excluded.last_counted_at - interval '2 hours';
$$;

revoke all on function public.record_product_view(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_product_view(uuid, uuid) to anon, authenticated;
