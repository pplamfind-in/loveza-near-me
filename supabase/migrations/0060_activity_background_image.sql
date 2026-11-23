alter table public.flavor_polls
  add column background_image_url text check (char_length(background_image_url) <= 500);

grant insert (background_image_url), update (background_image_url)
  on public.flavor_polls to authenticated;
