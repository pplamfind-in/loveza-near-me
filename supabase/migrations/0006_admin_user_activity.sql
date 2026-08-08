-- Admin-only view of signed-in users and their location-report activity.

create or replace function public.admin_user_activity()
returns table (
  user_id uuid,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_reports bigint,
  approved_reports bigint,
  pending_reports bigint,
  rejected_reports bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    users.id as user_id,
    coalesce(
      profiles.display_name,
      users.raw_user_meta_data ->> 'full_name',
      users.raw_user_meta_data ->> 'name',
      split_part(coalesce(users.email, ''), '@', 1)
    ) as display_name,
    coalesce(profiles.email, users.email) as email,
    coalesce(
      users.raw_user_meta_data ->> 'avatar_url',
      users.raw_user_meta_data ->> 'picture'
    ) as avatar_url,
    users.created_at,
    users.last_sign_in_at,
    count(reports.id) as total_reports,
    count(reports.id) filter (where reports.approval_status = 'approved') as approved_reports,
    count(reports.id) filter (where reports.approval_status = 'pending') as pending_reports,
    count(reports.id) filter (where reports.approval_status = 'rejected') as rejected_reports
  from auth.users as users
  left join public.profiles as profiles on profiles.id = users.id
  left join public.reports as reports on reports.reporter_id = users.id
  where coalesce(users.raw_app_meta_data ->> 'role', 'user') <> 'admin'
    and coalesce(profiles.role, 'user') <> 'admin'
  group by
    users.id,
    profiles.display_name,
    profiles.email,
    users.email,
    users.raw_user_meta_data,
    users.created_at,
    users.last_sign_in_at
  order by users.last_sign_in_at desc nulls last, users.created_at desc;
end;
$$;

revoke all on function public.admin_user_activity() from public, anon;
grant execute on function public.admin_user_activity() to authenticated;
