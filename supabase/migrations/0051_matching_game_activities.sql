alter table public.flavor_polls
  add column activity_type text not null default 'poll'
  check (activity_type in ('poll', 'matching'));

grant insert (activity_type) on public.flavor_polls to authenticated;

create or replace function public.lock_flavor_poll_for_vote()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.flavor_polls
  where id = new.poll_id and activity_type = 'poll' and is_published and is_active
    and (starts_at is null or starts_at <= statement_timestamp())
    and (ends_at is null or ends_at > statement_timestamp())
    and new.option_label = any(options)
  for share;

  if not found then
    raise exception 'The poll is closed or the option is invalid' using errcode = '23514';
  end if;
  return new;
end;
$$;
