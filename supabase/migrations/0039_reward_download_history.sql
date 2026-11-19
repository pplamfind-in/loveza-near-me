create table public.reward_download_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  display_name text not null default coalesce(
    nullif(left(btrim(auth.jwt() -> 'user_metadata' ->> 'display_name'), 100), ''),
    nullif(left(btrim(auth.jwt() -> 'user_metadata' ->> 'full_name'), 100), ''),
    nullif(left(btrim(auth.jwt() -> 'user_metadata' ->> 'name'), 100), ''),
    'สมาชิก Loveza'
  ),
  reward_id text not null,
  downloaded_at timestamptz not null default now()
);

create index reward_download_events_recent_idx
  on public.reward_download_events (downloaded_at desc, id desc);

alter table public.reward_download_events enable row level security;
revoke all on public.reward_download_events from anon, authenticated;
grant select on public.reward_download_events to authenticated;
grant insert (reward_id) on public.reward_download_events to authenticated;

create policy "Admins can read reward downloads"
  on public.reward_download_events for select to authenticated using (public.is_admin());

create policy "Members can record their own downloads"
  on public.reward_download_events for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.explorer_rewards where id = reward_id and is_active)
  );

create view public.admin_reward_download_history
with (security_invoker = true) as
select
  event.id,
  event.user_id,
  event.display_name,
  event.reward_id,
  coalesce(reward.name, event.reward_id) as reward_name,
  event.downloaded_at,
  count(*) over (partition by event.user_id) as user_downloads,
  count(*) over (partition by event.user_id, event.reward_id) as user_reward_downloads
from public.reward_download_events event
left join public.explorer_rewards reward on reward.id = event.reward_id;

revoke all on public.admin_reward_download_history from anon, authenticated;
grant select on public.admin_reward_download_history to authenticated;
