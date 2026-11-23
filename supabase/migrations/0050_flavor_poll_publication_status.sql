alter table public.flavor_polls
  add column is_published boolean not null default true;

grant insert (is_published), update (is_published) on public.flavor_polls to authenticated;

drop policy "Read published activities" on public.flavor_polls;
create policy "Read published activities" on public.flavor_polls for select using (
  (is_published and (starts_at is null or starts_at <= now())) or (select public.is_admin())
);

create or replace function public.lock_flavor_poll_for_vote()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.flavor_polls
  where id = new.poll_id and is_published and is_active
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
