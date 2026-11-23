alter table public.flavor_polls
  add column description_html text not null default ''
  check (char_length(description_html) <= 20000);

grant insert (description_html), update (description_html)
  on public.flavor_polls to authenticated;
