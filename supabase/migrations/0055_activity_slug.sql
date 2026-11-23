alter table public.flavor_polls
  add column slug text unique
  check (
    char_length(slug) <= 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and slug !~ '^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$'
  );

grant insert (slug), update (slug) on public.flavor_polls to authenticated;

update public.flavor_polls
set slug = 'loveza-new-flavor'
where id = '8b6b3f37-e645-43e9-a4c8-ddd1b5a7273b' and slug is null;
