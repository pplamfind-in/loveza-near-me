drop policy "Read visible flavor polls" on public.flavor_polls;
create policy "Read activities" on public.flavor_polls for select using (true);

grant update (title, options), delete on public.flavor_polls to authenticated;
create policy "Admins delete flavor polls" on public.flavor_polls
  for delete to authenticated using ((select public.is_admin()));

-- Serialize vote validation with edits to the same poll.
create function public.lock_flavor_poll_for_vote()
returns trigger language plpgsql set search_path = ''
as $$
begin
  perform 1 from public.flavor_polls
  where id = new.poll_id and is_active and new.option_label = any(options)
  for share;

  if not found then
    raise exception 'The poll is closed or the option is invalid' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- A row-locking select needs UPDATE privileges and visibility. Run only this check
-- as the table owner; the existing insert policy still validates the voter.
alter function public.lock_flavor_poll_for_vote() security definer;
revoke all on function public.lock_flavor_poll_for_vote() from public;
create trigger lock_flavor_poll_for_vote
  before insert on public.flavor_poll_votes
  for each row execute function public.lock_flavor_poll_for_vote();

create function public.prevent_voted_flavor_option_changes()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.options is distinct from old.options and exists (
    select 1 from public.flavor_poll_votes where poll_id = old.id
  ) then
    raise exception 'Options cannot change after voting starts' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger prevent_voted_flavor_option_changes
  before update of options on public.flavor_polls
  for each row execute function public.prevent_voted_flavor_option_changes();
