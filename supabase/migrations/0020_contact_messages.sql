-- Contact form inbox. Anyone can submit, but only admins can read or manage messages.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 2 and 150),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create index if not exists contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute procedure public.set_updated_at();

alter table public.contact_messages enable row level security;

-- Keep the public role write-only. Admin reads and status changes are still
-- constrained by the RLS policies below.
revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select, update, delete on table public.contact_messages to authenticated;

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
drop policy if exists "contact_messages_select_admin" on public.contact_messages;
drop policy if exists "contact_messages_update_admin" on public.contact_messages;
drop policy if exists "contact_messages_delete_admin" on public.contact_messages;

create policy "contact_messages_insert_public" on public.contact_messages
  for insert to anon, authenticated
  with check (
    status = 'new'
    and resolved_at is null
    and resolved_by is null
  );

create policy "contact_messages_select_admin" on public.contact_messages
  for select to authenticated using (public.is_admin());

create policy "contact_messages_update_admin" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "contact_messages_delete_admin" on public.contact_messages
  for delete to authenticated using (public.is_admin());
