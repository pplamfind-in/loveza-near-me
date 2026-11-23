create table public.activity_photo_likes (
  photo_id uuid not null references public.activity_photo_submissions(id) on delete cascade,
  browser_id uuid not null,
  primary key (photo_id, browser_id)
);

alter table public.activity_photo_likes enable row level security;
revoke all on public.activity_photo_likes from public, anon, authenticated;

create function public.set_activity_gallery_like(target_photo_id uuid, viewer_browser_id uuid, should_like boolean)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if viewer_browser_id is null or should_like is null then
    raise invalid_parameter_value using message = 'Browser and like state are required';
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
    values (target_photo_id, viewer_browser_id)
    on conflict (photo_id, browser_id) do nothing;
  else
    delete from public.activity_photo_likes
    where photo_id = target_photo_id and browser_id = viewer_browser_id;
  end if;

  return (select count(*) from public.activity_photo_likes where photo_id = target_photo_id);
end;
$$;

create function public.get_activity_gallery_my_likes(target_photo_ids uuid[], viewer_browser_id uuid)
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
  where cardinality(target_photo_ids) <= 25 and likes.browser_id = viewer_browser_id
    and likes.photo_id = any(target_photo_ids) and submission.public_preview is not null
    and activity.activity_type = 'photo' and activity.is_published
    and (activity.starts_at is null or activity.starts_at <= statement_timestamp());
$$;

drop function public.list_activity_gallery(uuid, integer);

create function public.list_activity_gallery(target_activity_id uuid, page_offset integer)
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
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

revoke all on function public.set_activity_gallery_like(uuid, uuid, boolean),
  public.get_activity_gallery_my_likes(uuid[], uuid), public.list_activity_gallery(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.set_activity_gallery_like(uuid, uuid, boolean),
  public.get_activity_gallery_my_likes(uuid[], uuid), public.list_activity_gallery(uuid, integer)
  to anon, authenticated;
