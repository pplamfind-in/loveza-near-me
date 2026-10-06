alter table public.forum_threads add column image_path text;
alter table public.forum_threads add constraint forum_threads_image_owner check (
  image_path is null or image_path ~ ('^' || author_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
);
grant insert (image_path), update (image_path) on public.forum_threads to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('forum-images','forum-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy forum_images_read on storage.objects for select using(bucket_id='forum-images');
create policy forum_images_create on storage.objects for insert to authenticated with check (
  bucket_id='forum-images' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy forum_images_delete on storage.objects for delete to authenticated using (
  bucket_id='forum-images' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin())
);
notify pgrst, 'reload schema';
