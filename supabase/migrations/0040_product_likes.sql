create table public.product_like_counts (
  product_id uuid primary key references public.products(id) on delete cascade,
  like_count bigint not null default 0 check (like_count >= 0)
);

alter table public.product_like_counts enable row level security;
revoke all on public.product_like_counts from public, anon, authenticated;
grant select on public.product_like_counts to anon, authenticated;

create policy "Read likes for active products"
  on public.product_like_counts for select to anon, authenticated
  using (exists (select 1 from public.products where id = product_id and is_active));

create function public.add_product_likes(target_product_id uuid, amount integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  total bigint;
begin
  if auth.uid() is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if amount is null or amount < 1 or amount > 100 then
    raise invalid_parameter_value using message = 'Invalid like batch';
  end if;

  insert into public.product_like_counts as counts (product_id, like_count)
  select id, amount from public.products where id = target_product_id and is_active
  on conflict (product_id) do update set like_count = counts.like_count + excluded.like_count
  returning like_count into total;

  return total;
end;
$$;

revoke all on function public.add_product_likes(uuid, integer) from public, anon, authenticated;
grant execute on function public.add_product_likes(uuid, integer) to authenticated;
