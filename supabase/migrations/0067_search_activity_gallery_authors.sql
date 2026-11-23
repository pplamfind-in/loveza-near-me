create function public.list_activity_gallery(target_activity_id uuid, page_offset integer, author_query text)
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
    and char_length(btrim(author_query)) between 1 and 100
    and strpos(
      lower(coalesce(nullif(submission.public_author_name, ''), 'ผู้ร่วมกิจกรรม')),
      lower(btrim(author_query))
    ) > 0
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

revoke all on function public.list_activity_gallery(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.list_activity_gallery(uuid, integer, text)
  to anon, authenticated;
