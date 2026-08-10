-- Admin-managed Hero banners for the Landing page.

create table if not exists public.landing_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  image_url text not null,
  mobile_image_url text,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.landing_banners enable row level security;

drop policy if exists "landing_banners_select_public" on public.landing_banners;
drop policy if exists "landing_banners_insert_admin" on public.landing_banners;
drop policy if exists "landing_banners_update_admin" on public.landing_banners;
drop policy if exists "landing_banners_delete_admin" on public.landing_banners;

create policy "landing_banners_select_public" on public.landing_banners
  for select using (is_active = true or public.is_admin());
create policy "landing_banners_insert_admin" on public.landing_banners
  for insert to authenticated with check (public.is_admin());
create policy "landing_banners_update_admin" on public.landing_banners
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "landing_banners_delete_admin" on public.landing_banners
  for delete to authenticated using (public.is_admin());

insert into public.landing_banners (
  id, title, image_url, mobile_image_url, alt_text, sort_order, is_active
)
values (
  '00000000-0000-4000-8000-000000000019',
  'Loveza Hero หลัก',
  '/assets/loveza/background-loveza.png',
  '/assets/loveza/background-loveza-mobile.png',
  'Loveza Love Potion vitamin soda รสน้ำผึ้งมะนาว ลิ้นจี่ และองุ่นเคียวโฮ',
  1,
  true
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'landing-banner-images',
  'landing-banner-images',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "landing_banner_images_select_public" on storage.objects;
drop policy if exists "landing_banner_images_insert_admin" on storage.objects;
drop policy if exists "landing_banner_images_update_admin" on storage.objects;
drop policy if exists "landing_banner_images_delete_admin" on storage.objects;

create policy "landing_banner_images_select_public" on storage.objects
  for select using (bucket_id = 'landing-banner-images');
create policy "landing_banner_images_insert_admin" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'landing-banner-images' and public.is_admin()
  );
create policy "landing_banner_images_update_admin" on storage.objects
  for update to authenticated using (
    bucket_id = 'landing-banner-images' and public.is_admin()
  ) with check (
    bucket_id = 'landing-banner-images' and public.is_admin()
  );
create policy "landing_banner_images_delete_admin" on storage.objects
  for delete to authenticated using (
    bucket_id = 'landing-banner-images' and public.is_admin()
  );
