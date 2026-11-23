create function public.list_admin_activity_photos(
  target_activity_id uuid, author_query text
)
returns table (
  id uuid, image_path text, created_at timestamptz, is_hidden boolean,
  author_name text, like_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id, submission.image_path, submission.created_at, submission.is_hidden,
    author.name,
    (select count(*) from public.activity_photo_likes as likes where likes.photo_id = submission.id)
  from public.activity_photo_submissions as submission
  left join public.profiles as profile on profile.id =
    case when split_part(submission.image_path, '/', 1) ~*
      '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'
      then split_part(submission.image_path, '/', 1)::uuid
    end
  cross join lateral (
    select coalesce(
      nullif(nullif(profile.display_name, ''), profile.email),
      nullif(submission.public_author_name, ''),
      'ผู้ร่วมกิจกรรม'
    ) as name
  ) as author
  where (select public.is_admin())
    and submission.activity_id = target_activity_id
    and char_length(author_query) <= 100
    and (author_query = '' or strpos(lower(author.name), lower(author_query)) > 0);
$$;

revoke all on function public.list_admin_activity_photos(uuid, text)
  from public, anon, authenticated;
grant execute on function public.list_admin_activity_photos(uuid, text)
  to authenticated;
