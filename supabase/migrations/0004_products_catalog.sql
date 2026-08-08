-- Admin-managed Loveza product catalog rendered on the public landing page.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  thai_name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  color text not null default '#00a9dc' check (color ~ '^#[0-9a-fA-F]{6}$'),
  accent text not null default '#087cae' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  fruit text not null default '🥤',
  meta text not null default 'VITAMIN B3 • B6 • B12',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_sort_idx
  on public.products (is_active, sort_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "products_select_active" on public.products;
create policy "products_select_active" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated using (public.is_admin());

insert into public.products
  (name, thai_name, slug, description, color, accent, fruit, meta, sort_order)
values
  ('Honey Lemon', 'รสน้ำผึ้งมะนาว', 'honey-lemon', 'หอมสดชื่นด้วยน้ำผึ้งและมะนาว', '#00a9dc', '#087cae', '🍋', 'VITAMIN B3 • B6 • B12', 1),
  ('Lychee', 'รสลิ้นจี่', 'lychee', 'หวานหอม สดชื่นในสไตล์ลิ้นจี่', '#ee2c82', '#00a99d', '🫧', 'VITAMIN B3 • B6 • B12', 2),
  ('Kyoho Grape', 'รสองุ่นเคียวโฮ', 'kyoho-grape', 'รสองุ่นเคียวโฮ หอมเข้มเต็มรส', '#7245a3', '#4d287e', '🍇', 'VITAMIN B3 • B6 • B12', 3)
on conflict (slug) do nothing;
