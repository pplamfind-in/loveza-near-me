-- Stream the public aggregate count to product detail pages.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'product_like_counts'
    )
  then
    alter publication supabase_realtime add table public.product_like_counts;
  end if;
end
$$;
