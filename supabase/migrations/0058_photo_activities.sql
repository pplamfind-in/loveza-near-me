alter table public.flavor_polls
  drop constraint flavor_polls_activity_type_check,
  drop constraint flavor_polls_options_check,
  add constraint flavor_polls_activity_type_check check (activity_type in ('poll', 'matching', 'photo')),
  add constraint flavor_polls_options_check check (
    (activity_type = 'photo' and cardinality(options) = 0)
    or (activity_type <> 'photo' and cardinality(options) between 2 and 12)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('activity-submission-images', 'activity-submission-images', false, 4194304, array['image/webp']);

create table public.activity_photo_submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.flavor_polls(id) on delete restrict,
  image_path text not null unique,
  created_at timestamptz not null default now()
);

create index activity_photo_submissions_activity_created_idx
  on public.activity_photo_submissions (activity_id, created_at desc, id desc);

alter table public.activity_photo_submissions enable row level security;
revoke all on public.activity_photo_submissions from public, anon, authenticated;
grant select on public.activity_photo_submissions to authenticated;

create policy "Admins read activity photo submissions" on public.activity_photo_submissions
  for select to authenticated using ((select public.is_admin()));

create policy "Participants upload activity photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'activity-submission-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.flavor_polls as activity
      where activity.id::text = (storage.foldername(name))[2]
        and activity.activity_type = 'photo' and activity.is_published and activity.is_active
        and (activity.starts_at is null or activity.starts_at <= statement_timestamp())
        and (activity.ends_at is null or activity.ends_at > statement_timestamp())
    )
  );

create policy "Admins or uploaders read activity photo objects" on storage.objects
  for select to authenticated using (
    bucket_id = 'activity-submission-images'
    and ((select public.is_admin()) or (storage.foldername(name))[1] = (select auth.uid())::text)
  );

create function public.activity_photo_is_unsubmitted(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(object_path, '/', 1) = auth.uid()::text
    and not exists (
      select 1 from public.activity_photo_submissions where image_path = object_path
    );
$$;

revoke all on function public.activity_photo_is_unsubmitted(text) from public, anon;
grant execute on function public.activity_photo_is_unsubmitted(text) to authenticated;

create policy "Participants clean up their uploaded activity photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'activity-submission-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.activity_photo_is_unsubmitted(name)
  );

create function public.submit_activity_photo(target_activity_id uuid, object_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or split_part(object_path, '/', 1) is distinct from auth.uid()::text
    or split_part(object_path, '/', 2) is distinct from target_activity_id::text
    or not exists (
      select 1 from storage.objects
      where bucket_id = 'activity-submission-images' and name = object_path
    )
  then
    raise insufficient_privilege using message = 'Invalid activity photo';
  end if;

  perform 1 from public.flavor_polls
  where id = target_activity_id and activity_type = 'photo' and is_published and is_active
    and (starts_at is null or starts_at <= statement_timestamp())
    and (ends_at is null or ends_at > statement_timestamp())
  for share;
  if not found then
    raise check_violation using message = 'Activity is closed';
  end if;

  insert into public.activity_photo_submissions (activity_id, image_path)
  values (target_activity_id, object_path)
  on conflict (image_path) do nothing;
end;
$$;

revoke all on function public.submit_activity_photo(uuid, text) from public, anon;
grant execute on function public.submit_activity_photo(uuid, text) to authenticated;
