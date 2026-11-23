alter table public.flavor_polls
  add column option_details jsonb not null default '{}'::jsonb
  check (jsonb_typeof(option_details) = 'object');

grant insert (option_details), update (option_details) on public.flavor_polls to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flavor-poll-images', 'flavor-poll-images', true, 4194304, array['image/webp'])
on conflict (id) do nothing;

create policy "Admins upload poll option images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'flavor-poll-images' and (select public.is_admin()));
