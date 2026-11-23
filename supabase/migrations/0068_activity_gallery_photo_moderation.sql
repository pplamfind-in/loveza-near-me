alter table public.activity_photo_submissions
  add column is_hidden boolean not null default false;

create function public.set_activity_photo_hidden(
  target_activity_id uuid, target_photo_id uuid, should_hide boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  update public.activity_photo_submissions as submission
  set is_hidden = should_hide
  where submission.id = target_photo_id and submission.activity_id = target_activity_id;

  return found;
end;
$$;

revoke all on function public.set_activity_photo_hidden(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.set_activity_photo_hidden(uuid, uuid, boolean)
  to authenticated;

create or replace function public.get_activity_gallery_image(target_photo_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(submission.public_preview, 'base64')
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where submission.id = target_photo_id and activity.activity_type = 'photo'
    and activity.is_published and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
    and submission.public_preview is not null
    and not submission.is_hidden;
$$;

create or replace function public.list_activity_gallery(target_activity_id uuid, page_offset integer)
returns table (
  photo_id uuid, created_at timestamptz, author_name text, author_avatar_url text, like_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id, submission.created_at, submission.public_author_name,
    submission.public_author_avatar_url,
    (select count(*) from public.activity_photo_likes as likes where likes.photo_id = submission.id)
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where activity.id = target_activity_id and activity.activity_type = 'photo'
    and activity.is_published and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
    and submission.public_preview is not null
    and not submission.is_hidden
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

create or replace function public.list_activity_gallery(target_activity_id uuid, page_offset integer, author_query text)
returns table (
  photo_id uuid, created_at timestamptz, author_name text, author_avatar_url text, like_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id, submission.created_at, submission.public_author_name,
    submission.public_author_avatar_url,
    (select count(*) from public.activity_photo_likes as likes where likes.photo_id = submission.id)
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where activity.id = target_activity_id and activity.activity_type = 'photo'
    and activity.is_published and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
    and submission.public_preview is not null
    and not submission.is_hidden
    and char_length(btrim(author_query)) between 1 and 100
    and strpos(
      lower(coalesce(nullif(submission.public_author_name, ''), 'ผู้ร่วมกิจกรรม')),
      lower(btrim(author_query))
    ) > 0
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

create or replace function public.set_activity_gallery_like(target_photo_id uuid, should_like boolean)
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
    and not submission.is_hidden
    and activity.activity_type = 'photo' and activity.is_published
    and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
  for share of activity, submission;
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

create or replace function public.get_activity_gallery_my_likes(target_photo_ids uuid[])
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
    and not submission.is_hidden
    and activity.activity_type = 'photo' and activity.is_published
    and (activity.starts_at is null or activity.starts_at <= statement_timestamp());
$$;
