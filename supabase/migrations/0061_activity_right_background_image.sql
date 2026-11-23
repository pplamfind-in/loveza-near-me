alter table public.flavor_polls
  add column right_background_image_url text check (char_length(right_background_image_url) <= 500);

grant insert (right_background_image_url), update (right_background_image_url)
  on public.flavor_polls to authenticated;
