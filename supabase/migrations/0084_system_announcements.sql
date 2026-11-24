create table public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  content_html text not null check (char_length(content_html) between 1 and 100000),
  cover_path text,
  publish_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index system_announcements_publish_at_idx
  on public.system_announcements (publish_at desc, id);

alter table public.system_announcements enable row level security;
grant select on public.system_announcements to anon, authenticated;
grant insert, update, delete on public.system_announcements to authenticated;

create policy "Published announcements are public" on public.system_announcements
  for select to anon, authenticated using (publish_at <= now());

create policy "Admins manage announcements" on public.system_announcements
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('announcement-covers', 'announcement-covers', true, 5242880, array['image/webp']);

create policy "Admins manage announcement covers" on storage.objects
  for all to authenticated
  using (bucket_id = 'announcement-covers' and (select public.is_admin()))
  with check (bucket_id = 'announcement-covers' and (select public.is_admin()));

notify pgrst, 'reload schema';
