-- Allow an authenticated admin to promote a regular user without exposing the
-- Supabase service-role key to the application runtime.

create or replace function public.admin_promote_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin')
  where id = target_user_id;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  update public.profiles
  set role = 'admin'
  where id = target_user_id;
end;
$$;

revoke all on function public.admin_promote_user(uuid) from public, anon;
grant execute on function public.admin_promote_user(uuid) to authenticated;
