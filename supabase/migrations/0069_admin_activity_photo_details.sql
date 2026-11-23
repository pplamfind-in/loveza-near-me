create function public.get_admin_activity_photo_details(
  target_activity_id uuid, target_photo_ids uuid[]
)
returns table (photo_id uuid, author_name text, like_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id,
    coalesce(
      nullif(nullif(profile.display_name, ''), profile.email),
      nullif(submission.public_author_name, ''),
      'ผู้ร่วมกิจกรรม'
    ),
    (select count(*) from public.activity_photo_likes as likes where likes.photo_id = submission.id)
  from public.activity_photo_submissions as submission
  left join public.profiles as profile on profile.id =
    case when split_part(submission.image_path, '/', 1) ~*
      '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'
      then split_part(submission.image_path, '/', 1)::uuid
    end
  where (select public.is_admin())
    and cardinality(target_photo_ids) <= 24
    and submission.activity_id = target_activity_id
    and submission.id = any(target_photo_ids);
$$;

revoke all on function public.get_admin_activity_photo_details(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.get_admin_activity_photo_details(uuid, uuid[])
  to authenticated;
