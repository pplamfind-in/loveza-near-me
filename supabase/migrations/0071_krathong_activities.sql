alter table public.flavor_polls
  drop constraint flavor_polls_activity_type_check,
  drop constraint flavor_polls_options_check,
  add constraint flavor_polls_activity_type_check
    check (activity_type in ('poll', 'matching', 'photo', 'krathong')),
  add constraint flavor_polls_options_check check (
    (activity_type in ('photo', 'krathong') and cardinality(options) = 0)
    or (activity_type in ('poll', 'matching') and cardinality(options) between 2 and 12)
  );

create table public.activity_krathongs (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.flavor_polls(id) on delete cascade,
  design text not null check (design in ('lotus', 'marigold', 'orchid')),
  created_at timestamptz not null default clock_timestamp()
);

create index activity_krathongs_recent_idx
  on public.activity_krathongs (activity_id, created_at desc);

create table public.activity_krathong_wishes (
  krathong_id uuid primary key references public.activity_krathongs(id) on delete cascade,
  wish text not null check (char_length(wish) between 1 and 200)
);

alter table public.activity_krathongs enable row level security;
alter table public.activity_krathong_wishes enable row level security;
revoke all on public.activity_krathongs, public.activity_krathong_wishes
  from public, anon, authenticated;
grant select on public.activity_krathongs to anon, authenticated;

create policy "Read recent krathongs in published activities"
  on public.activity_krathongs for select to anon, authenticated
  using (
    created_at > now() - interval '60 seconds'
    and exists (
      select 1 from public.flavor_polls activity
      where activity.id = activity_id and activity.activity_type = 'krathong'
        and activity.is_published and (activity.starts_at is null or activity.starts_at <= now())
    )
  );

create function public.launch_activity_krathong(target_activity_id uuid, chosen_design text, wish_text text)
returns public.activity_krathongs
language plpgsql
security definer
set search_path = ''
as $$
declare
  launched public.activity_krathongs;
  clean_wish text := btrim(coalesce(wish_text, ''));
begin
  if chosen_design is null or chosen_design not in ('lotus', 'marigold', 'orchid')
    or char_length(clean_wish) > 200 then
    raise exception 'Invalid krathong' using errcode = '22023';
  end if;

  -- Serialize launches per activity to bound anonymous write volume.
  perform pg_advisory_xact_lock(hashtextextended('krathong:' || target_activity_id::text, 0));
  perform 1 from public.flavor_polls activity
    where activity.id = target_activity_id and activity.activity_type = 'krathong'
      and activity.is_published and activity.is_active
      and (activity.starts_at is null or activity.starts_at <= clock_timestamp())
      and (activity.ends_at is null or activity.ends_at > clock_timestamp())
    for share;
  if not found then
    raise exception 'Krathong activity is closed' using errcode = 'P0001';
  end if;

  if (select count(*) from public.activity_krathongs
      where activity_id = target_activity_id
        and created_at > clock_timestamp() - interval '1 second') >= 20 then
    raise exception 'Too many krathongs' using errcode = 'P0002';
  end if;

  insert into public.activity_krathongs (activity_id, design)
    values (target_activity_id, chosen_design) returning * into launched;
  if clean_wish <> '' then
    insert into public.activity_krathong_wishes (krathong_id, wish)
      values (launched.id, clean_wish);
  end if;
  return launched;
end;
$$;

revoke execute on function public.launch_activity_krathong(uuid, text, text) from public;
grant execute on function public.launch_activity_krathong(uuid, text, text) to anon, authenticated;

alter publication supabase_realtime add table public.activity_krathongs;
