-- Add Kanit to the admin-selectable site fonts. This is a separate migration
-- so databases that already applied 0022 receive the updated constraint.

alter table public.admin_settings
  drop constraint if exists admin_settings_site_font_check;

alter table public.admin_settings
  add constraint admin_settings_site_font_check
  check (site_font in ('line_seed', 'prompt', 'kanit'));
