-- Admin-selectable public font. Prompt is loaded by next/font; the database
-- stores only a constrained identifier rather than arbitrary CSS.

alter table public.admin_settings
  add column if not exists site_font text not null default 'line_seed';

alter table public.admin_settings
  drop constraint if exists admin_settings_site_font_check;

alter table public.admin_settings
  add constraint admin_settings_site_font_check
  check (site_font in ('line_seed', 'prompt'));

create or replace function public.get_site_font()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(settings.site_font, 'line_seed')
  from public.admin_settings as settings
  where settings.id = true;
$$;

revoke all on function public.get_site_font() from public;
grant execute on function public.get_site_font() to anon, authenticated;
