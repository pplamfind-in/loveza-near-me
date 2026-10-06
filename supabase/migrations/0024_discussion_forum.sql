-- Public reading; authenticated authors can edit their own content.
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default 'สมาชิก Loveza' check (char_length(author_name) between 1 and 100),
  title text not null check (char_length(btrim(title)) between 3 and 150),
  body text not null check (char_length(btrim(body)) between 10 and 10000),
  category text not null default 'พูดคุยทั่วไป' check (category in ('พูดคุยทั่วไป', 'แนะนำร้าน', 'รีวิวสินค้า', 'ถามตอบ')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default 'สมาชิก Loveza' check (char_length(author_name) between 1 and 100),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index forum_threads_created_idx on public.forum_threads (created_at desc, id);
create index forum_comments_thread_created_idx on public.forum_comments (thread_id, created_at, id);
create trigger forum_threads_updated before update on public.forum_threads for each row execute procedure public.set_updated_at();
create trigger forum_comments_updated before update on public.forum_comments for each row execute procedure public.set_updated_at();
alter table public.forum_threads enable row level security;
alter table public.forum_comments enable row level security;
revoke all on public.forum_threads, public.forum_comments from anon, authenticated;
grant select on public.forum_threads, public.forum_comments to anon, authenticated;
grant insert (title, body, category, author_name) on public.forum_threads to authenticated;
grant update (title, body, category) on public.forum_threads to authenticated;
grant insert (thread_id, body, author_name) on public.forum_comments to authenticated;
grant update (body) on public.forum_comments to authenticated;
grant delete on public.forum_threads, public.forum_comments to authenticated;
create policy forum_threads_read on public.forum_threads for select using (true);
create policy forum_threads_create on public.forum_threads for insert to authenticated with check ((select auth.uid()) = author_id);
create policy forum_threads_edit on public.forum_threads for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy forum_threads_delete on public.forum_threads for delete to authenticated using ((select auth.uid()) = author_id or public.is_admin());
create policy forum_comments_read on public.forum_comments for select using (true);
create policy forum_comments_create on public.forum_comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy forum_comments_edit on public.forum_comments for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy forum_comments_delete on public.forum_comments for delete to authenticated using ((select auth.uid()) = author_id or public.is_admin());

notify pgrst, 'reload schema';
