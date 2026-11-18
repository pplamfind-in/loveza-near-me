-- Publish aggregate explorer scores and display identity, without account IDs or email addresses.
create or replace function public.get_public_explorer_leaderboard(monthly boolean default true)
returns table (placement bigint, display_name text, avatar_url text, store_count bigint, province_count bigint)
language sql stable security definer set search_path = ''
as $$
  with scores as (
    select
      r.reporter_id,
      count(distinct r.store_id) as store_count,
      count(distinct nullif(btrim(r.province), '')) as province_count
    from public.reports r
    where r.approval_status = 'approved'
      and r.store_id is not null
      and (
        monthly is false
        or (
          r.created_at >= (date_trunc('month', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok')
          and r.created_at <= now()
        )
      )
    group by r.reporter_id
  ), ranked as (
    select
      rank() over (order by s.store_count desc) as placement,
      s.reporter_id,
      s.store_count,
      s.province_count,
      u.raw_user_meta_data as profile
    from scores s
    join auth.users u on u.id = s.reporter_id
  )
  select
    r.placement,
    left(coalesce(
      nullif(btrim(r.profile ->> 'display_name'), ''),
      nullif(btrim(r.profile ->> 'full_name'), ''),
      nullif(btrim(r.profile ->> 'name'), ''),
      'นักสำรวจ Loveza'
    ), 100),
    coalesce(
      nullif(r.profile ->> 'loveza_avatar', ''),
      nullif(r.profile ->> 'avatar_url', ''),
      nullif(r.profile ->> 'picture', '')
    ),
    r.store_count,
    r.province_count
  from ranked r
  where r.placement <= 100
  order by r.placement, r.reporter_id;
$$;

revoke all on function public.get_public_explorer_leaderboard(boolean) from public;
grant execute on function public.get_public_explorer_leaderboard(boolean) to anon, authenticated;
