-- Publish only display identity for the earliest approved report per active province.
-- Never expose reporter UUIDs, email addresses, or auth metadata to the browser.
create or replace function public.get_public_province_discoverers()
returns table (province text, display_name text, avatar_url text, discovered_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select distinct on (btrim(s.province))
    btrim(s.province)::text,
    coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), 'นักล่า Loveza')::text,
    coalesce(nullif(u.raw_user_meta_data ->> 'loveza_avatar', ''),
      nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(u.raw_user_meta_data ->> 'picture', ''))::text,
    r.created_at
  from public.reports r
  join public.stores s on s.id = r.store_id and s.is_active = true
  left join auth.users u on u.id = r.reporter_id
  where r.approval_status = 'approved' and nullif(btrim(s.province), '') is not null
  order by btrim(s.province), r.created_at, r.id;
$$;
revoke all on function public.get_public_province_discoverers() from public;
grant execute on function public.get_public_province_discoverers() to anon, authenticated;
