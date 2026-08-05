-- ตามหา Loveza — initial schema, RLS, and storage bucket.
-- Run this once against your Supabase project (SQL editor or `supabase db push`).

-- ----------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  province text not null,
  district text,
  subdistrict text,
  latitude double precision not null,
  longitude double precision not null,
  current_status text not null default 'unknown'
    check (current_status in ('available', 'low_stock', 'out_of_stock', 'unknown')),
  last_reported_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  store_name text not null,
  address text,
  province text not null,
  district text,
  subdistrict text,
  latitude double precision not null,
  longitude double precision not null,
  flavor text,
  stock_status text not null
    check (stock_status in ('available', 'low_stock', 'out_of_stock', 'unknown')),
  photo_url text,
  note text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------

create index if not exists stores_latitude_longitude_idx on public.stores (latitude, longitude);
create index if not exists stores_province_idx on public.stores (province);
create index if not exists reports_approval_status_idx on public.reports (approval_status);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_province_idx on public.reports (province);

-- ----------------------------------------------------------------------
-- Helper: is_admin() — security definer so RLS on `profiles` doesn't recurse
-- ----------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------

alter table public.stores enable row level security;
alter table public.reports enable row level security;
alter table public.profiles enable row level security;

-- stores: anyone can read active stores; only admins can write
create policy "stores_select_active" on public.stores
  for select using (is_active = true or public.is_admin());

create policy "stores_admin_insert" on public.stores
  for insert with check (public.is_admin());

create policy "stores_admin_update" on public.stores
  for update using (public.is_admin());

create policy "stores_admin_delete" on public.stores
  for delete using (public.is_admin());

-- reports: anyone can submit; only admins can read/manage all of them.
-- (submitters don't get a public "read own report" policy since the app
-- has no login for regular users — nothing to scope a read to.)
create policy "reports_insert_anyone" on public.reports
  for insert with check (approval_status = 'pending');

create policy "reports_select_admin" on public.reports
  for select using (public.is_admin());

create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

create policy "reports_delete_admin" on public.reports
  for delete using (public.is_admin());

-- public read of approved reports for the /latest page
create policy "reports_select_approved" on public.reports
  for select using (approval_status = 'approved');

-- profiles: users read their own row; admins read all
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- ----------------------------------------------------------------------
-- Storage: report-images bucket
-- ----------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-images',
  'report-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "report_images_public_read" on storage.objects
  for select using (bucket_id = 'report-images');

create policy "report_images_anyone_insert" on storage.objects
  for insert with check (bucket_id = 'report-images');

create policy "report_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'report-images' and public.is_admin());

-- No update policy on storage.objects for report-images: combined with the
-- app always generating a fresh UUID filename, this makes overwrites
-- impossible.
