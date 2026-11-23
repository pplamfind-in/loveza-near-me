alter table public.flavor_poll_votes
  drop constraint flavor_poll_votes_pkey,
  alter column voter_id drop not null,
  add column id uuid primary key default gen_random_uuid(),
  add column guest_id uuid,
  add constraint flavor_poll_votes_one_voter check (num_nonnulls(voter_id, guest_id) = 1),
  add constraint flavor_poll_votes_account_key unique (poll_id, voter_id),
  add constraint flavor_poll_votes_guest_key unique (poll_id, guest_id);

create function public.cast_guest_flavor_vote(target_poll_id uuid, browser_id uuid, choice text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null or browser_id is null then
    raise insufficient_privilege using message = 'Guest browser required';
  end if;

  perform 1
  from public.flavor_polls as polls
  where polls.id = target_poll_id
    and polls.activity_type = 'poll'
    and polls.is_published
    and polls.is_active
    and (polls.starts_at is null or polls.starts_at <= statement_timestamp())
    and (polls.ends_at is null or polls.ends_at > statement_timestamp())
    and choice = any(polls.options)
  for share;

  if not found then
    raise check_violation using message = 'Poll is closed or the option is invalid';
  end if;

  insert into public.flavor_poll_votes (poll_id, voter_id, guest_id, option_label)
  values (target_poll_id, null, browser_id, choice);
end;
$$;

create function public.get_guest_flavor_vote(target_poll_id uuid, browser_id uuid)
returns table (option_label text)
language sql
stable
security definer
set search_path = ''
as $$
  select votes.option_label
  from public.flavor_poll_votes as votes
  where votes.poll_id = target_poll_id and votes.guest_id = browser_id;
$$;

revoke all on function public.cast_guest_flavor_vote(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cast_guest_flavor_vote(uuid, uuid, text) to anon;

revoke all on function public.get_guest_flavor_vote(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_guest_flavor_vote(uuid, uuid) to anon, authenticated;
