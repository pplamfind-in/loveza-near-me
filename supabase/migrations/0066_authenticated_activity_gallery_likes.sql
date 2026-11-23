drop function public.set_activity_gallery_like(uuid, uuid, boolean);
drop function public.get_activity_gallery_my_likes(uuid[], uuid);

-- Preserve legacy browser likes in public totals. New likes use the account UUID.
create function public.set_activity_gallery_like(target_photo_id uuid, should_like boolean)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := auth.uid();
begin
  if viewer_id is null then
    raise insufficient_privilege using message = 'Sign in to like photos';
  end if;
  if should_like is null then
    raise invalid_parameter_value using message = 'Like state is required';
  end if;

  perform 1
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where submission.id = target_photo_id and submission.public_preview is not null
    and activity.activity_type = 'photo' and activity.is_published
    and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
  for share of activity;
  if not found then
    raise insufficient_privilege using message = 'Photo is not public';
  end if;

  if should_like then
    insert into public.activity_photo_likes (photo_id, browser_id)
    values (target_photo_id, viewer_id)
    on conflict (photo_id, browser_id) do nothing;
  else
    delete from public.activity_photo_likes
    where photo_id = target_photo_id and browser_id = viewer_id;
  end if;

  return (select count(*) from public.activity_photo_likes where photo_id = target_photo_id);
end;
$$;

create function public.get_activity_gallery_my_likes(target_photo_ids uuid[])
returns table (photo_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select likes.photo_id
  from public.activity_photo_likes as likes
  join public.activity_photo_submissions as submission on submission.id = likes.photo_id
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where cardinality(target_photo_ids) <= 25 and likes.browser_id = (select auth.uid())
    and likes.photo_id = any(target_photo_ids) and submission.public_preview is not null
    and activity.activity_type = 'photo' and activity.is_published
    and (activity.starts_at is null or activity.starts_at <= statement_timestamp());
$$;

revoke all on function public.set_activity_gallery_like(uuid, boolean),
  public.get_activity_gallery_my_likes(uuid[]) from public, anon, authenticated;
grant execute on function public.set_activity_gallery_like(uuid, boolean),
  public.get_activity_gallery_my_likes(uuid[]) to authenticated;
