alter table public.activity_photo_submissions
  add column public_preview bytea check (octet_length(public_preview) <= 240000);

create function public.submit_activity_photo(
  target_activity_id uuid,
  object_path text,
  public_preview_base64 text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  preview_bytes bytea;
begin
  if public_preview_base64 is not null then
    if char_length(public_preview_base64) > 320000 then
      raise invalid_parameter_value using message = 'Photo preview is too large';
    end if;
    preview_bytes := decode(public_preview_base64, 'base64');
    if octet_length(preview_bytes) < 12
      or substring(preview_bytes from 1 for 4) <> convert_to('RIFF', 'UTF8')
      or substring(preview_bytes from 9 for 4) <> convert_to('WEBP', 'UTF8')
    then
      raise invalid_parameter_value using message = 'Photo preview must be WebP';
    end if;
  end if;

  perform public.submit_activity_photo(target_activity_id, object_path);
  if preview_bytes is not null then
    update public.activity_photo_submissions
    set public_preview = preview_bytes
    where activity_id = target_activity_id and image_path = object_path and public_preview is null;
  end if;
end;
$$;

create function public.list_activity_gallery(target_activity_id uuid, page_offset integer)
returns table (photo_id uuid, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select submission.id, submission.created_at
  from public.activity_photo_submissions as submission
  join public.flavor_polls as activity on activity.id = submission.activity_id
  where activity.id = target_activity_id and activity.activity_type = 'photo'
    and activity.is_published and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
    and submission.public_preview is not null
  order by submission.created_at desc, submission.id desc
  offset greatest(page_offset, 0)
  limit 25;
$$;

create function public.get_activity_gallery_image(target_photo_id uuid)
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
    and submission.public_preview is not null;
$$;

revoke all on function public.submit_activity_photo(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_activity_photo(uuid, text, text) to authenticated;

revoke all on function public.list_activity_gallery(uuid, integer), public.get_activity_gallery_image(uuid)
  from public, anon, authenticated;
grant execute on function public.list_activity_gallery(uuid, integer), public.get_activity_gallery_image(uuid)
  to anon, authenticated;
