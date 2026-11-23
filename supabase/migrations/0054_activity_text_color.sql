alter table public.flavor_polls
  add column theme_text_color text check (theme_text_color ~ '^#[0-9A-Fa-f]{6}$');

grant insert (theme_text_color), update (theme_text_color) on public.flavor_polls to authenticated;
