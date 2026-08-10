-- Let admins configure the province store-count thresholds and colors used by /mapza.

alter table public.admin_settings
  add column if not exists province_no_data_color text not null default '#B1BFBF',
  add column if not exists province_tier_1_max integer not null default 2,
  add column if not exists province_tier_1_color text not null default '#70E1F5',
  add column if not exists province_tier_2_max integer not null default 6,
  add column if not exists province_tier_2_color text not null default '#FDE047',
  add column if not exists province_tier_3_max integer not null default 14,
  add column if not exists province_tier_3_color text not null default '#FF78B8',
  add column if not exists province_tier_4_color text not null default '#E5007E';

alter table public.admin_settings
  drop constraint if exists admin_settings_province_tier_order_check,
  drop constraint if exists admin_settings_province_colors_check;

alter table public.admin_settings
  add constraint admin_settings_province_tier_order_check check (
    province_tier_1_max between 1 and 999997
    and province_tier_2_max between 2 and 999998
    and province_tier_3_max between 3 and 999999
    and province_tier_1_max < province_tier_2_max
    and province_tier_2_max < province_tier_3_max
  ),
  add constraint admin_settings_province_colors_check check (
    province_no_data_color ~ '^#[0-9A-Fa-f]{6}$'
    and province_tier_1_color ~ '^#[0-9A-Fa-f]{6}$'
    and province_tier_2_color ~ '^#[0-9A-Fa-f]{6}$'
    and province_tier_3_color ~ '^#[0-9A-Fa-f]{6}$'
    and province_tier_4_color ~ '^#[0-9A-Fa-f]{6}$'
  );

create or replace function public.get_public_map_settings()
returns table (
  province_no_data_color text,
  province_tier_1_max integer,
  province_tier_1_color text,
  province_tier_2_max integer,
  province_tier_2_color text,
  province_tier_3_max integer,
  province_tier_3_color text,
  province_tier_4_color text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    settings.province_no_data_color,
    settings.province_tier_1_max,
    settings.province_tier_1_color,
    settings.province_tier_2_max,
    settings.province_tier_2_color,
    settings.province_tier_3_max,
    settings.province_tier_3_color,
    settings.province_tier_4_color
  from public.admin_settings as settings
  where settings.id = true;
$$;

revoke all on function public.get_public_map_settings() from public;
grant execute on function public.get_public_map_settings() to anon, authenticated;
