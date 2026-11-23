create table public.flavor_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  options text[] not null check (cardinality(options) between 2 and 12),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.flavor_poll_votes (
  poll_id uuid not null references public.flavor_polls(id) on delete cascade,
  voter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  option_label text not null,
  primary key (poll_id, voter_id)
);

alter table public.flavor_polls enable row level security;
alter table public.flavor_poll_votes enable row level security;

revoke all on public.flavor_polls, public.flavor_poll_votes from anon, authenticated;
grant select on public.flavor_polls to anon, authenticated;
grant insert (title, options), update (is_active) on public.flavor_polls to authenticated;
grant select on public.flavor_poll_votes to authenticated;
grant insert (poll_id, option_label) on public.flavor_poll_votes to authenticated;

create policy "Read visible flavor polls" on public.flavor_polls
  for select using (is_active or (select public.is_admin()));
create policy "Admins create flavor polls" on public.flavor_polls
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins manage flavor polls" on public.flavor_polls
  for update to authenticated using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Read own flavor votes or administer results" on public.flavor_poll_votes
  for select to authenticated
  using (voter_id = (select auth.uid()) or (select public.is_admin()));
create policy "Vote for an option in an open flavor poll" on public.flavor_poll_votes
  for insert to authenticated with check (
    voter_id = (select auth.uid()) and exists (
      select 1 from public.flavor_polls poll
      where poll.id = poll_id and poll.is_active and option_label = any(poll.options)
    )
  );

create function public.get_flavor_poll_totals()
returns table (poll_id uuid, option_label text, vote_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select votes.poll_id, votes.option_label, count(*)
  from public.flavor_poll_votes votes
  where (select public.is_admin())
  group by votes.poll_id, votes.option_label;
$$;
revoke all on function public.get_flavor_poll_totals() from public;
grant execute on function public.get_flavor_poll_totals() to authenticated;

insert into public.flavor_polls (title, options)
values (
  'ถ้า LOVEZA มีรสใหม่ อยากให้เป็นรสอะไร?',
  array['ต้มยำ', 'มินต์ช็อก', 'วาซาบิ', 'ทุเรียน', 'น้ำปลา', 'หม่าล่า']
);
