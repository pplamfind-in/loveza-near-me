alter table public.activity_photo_submissions
  add column public_author_name text check (char_length(public_author_name) <= 100),
  add column public_author_avatar_url text check (char_length(public_author_avatar_url) <= 500);

create function public.submit_activity_photo(
  target_activity_id uuid,
  object_path text,
  public_preview_base64 text,
  share_profile boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := auth.jwt() -> 'user_metadata';
  author_name text;
  avatar text;
begin
  perform public.submit_activity_photo(target_activity_id, object_path, public_preview_base64);

  if share_profile is true and public_preview_base64 is not null then
    author_name := coalesce(
      nullif(btrim(metadata ->> 'display_name'), ''),
      nullif(btrim(metadata ->> 'full_name'), ''),
      nullif(btrim(metadata ->> 'name'), ''),
      'ผู้ร่วมกิจกรรม'
    );
    if author_name = auth.jwt() ->> 'email' then
      author_name := 'ผู้ร่วมกิจกรรม';
    end if;

    avatar := metadata ->> 'loveza_avatar';
    if avatar is null or avatar !~ '^/assets/avatar/avatar-[a-z0-9-]+\.webp$' then
      avatar := coalesce(nullif(metadata ->> 'avatar_url', ''), metadata ->> 'picture');
      if avatar is not null and avatar !~ '^https://lh[0-9]+\.googleusercontent\.com/[a-zA-Z0-9_./=+%-]+$' then
        avatar := null;
      end if;
    end if;

    update public.activity_photo_submissions
    set public_author_name = left(author_name, 100),
        public_author_avatar_url = case when char_length(avatar) <= 500 then avatar end
    where activity_id = target_activity_id and image_path = object_path
      and public_preview is not null and public_author_name is null;
  end if;
end;
$$;

revoke all on function public.submit_activity_photo(uuid, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.submit_activity_photo(uuid, text, text, boolean) to authenticated;

drop function public.list_activity_gallery(uuid, integer);

create function public.list_activity_gallery(target_activity_id uuid, page_offset integer)
returns table (photo_id uuid, created_at timestamptz, author_name text, author_avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id, submission.created_at, submission.public_author_name, submission.public_author_avatar_url
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where activity.id = target_activity_id and activity.activity_type = 'photo'
    and activity.is_published and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
    and submission.public_preview is not null
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

revoke all on function public.list_activity_gallery(uuid, integer) from public, anon, authenticated;
grant execute on function public.list_activity_gallery(uuid, integer) to anon, authenticated;
