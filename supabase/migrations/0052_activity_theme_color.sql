alter table public.flavor_polls
  add column theme_color text check (theme_color ~ '^#[0-9A-Fa-f]{6}$');

grant insert (theme_color), update (theme_color) on public.flavor_polls to authenticated;
