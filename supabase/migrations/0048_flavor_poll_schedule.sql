alter table public.flavor_polls
  add column starts_at timestamptz,
  add column ends_at timestamptz,
  add column source_url text,
  add constraint flavor_poll_schedule_order check (
    starts_at is null or ends_at is null or ends_at > starts_at
  ),
  add constraint flavor_poll_source_url check (
    source_url is null or (source_url like 'https://%' and char_length(source_url) <= 2048)
  );

grant insert (starts_at, ends_at, source_url),
      update (starts_at, ends_at, source_url) on public.flavor_polls to authenticated;

drop policy "Read activities" on public.flavor_polls;
create policy "Read published activities" on public.flavor_polls for select using (
  starts_at is null or starts_at <= now() or (select public.is_admin())
);

create or replace function public.lock_flavor_poll_for_vote()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.flavor_polls
  where id = new.poll_id and is_active
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
