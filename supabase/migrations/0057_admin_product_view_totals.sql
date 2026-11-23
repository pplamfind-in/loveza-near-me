create function public.get_admin_product_view_totals()
returns table (product_id uuid, view_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  return query
  select views.product_id, sum(views.view_count)::bigint
  from public.product_views as views
  group by views.product_id;
end;
$$;

revoke all on function public.get_admin_product_view_totals() from public, anon, authenticated;
grant execute on function public.get_admin_product_view_totals() to authenticated;
