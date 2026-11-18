alter table public.explorer_rewards
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;
alter table public.explorer_rewards add constraint explorer_rewards_valid_window
  check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at is not null and ends_at > starts_at));
