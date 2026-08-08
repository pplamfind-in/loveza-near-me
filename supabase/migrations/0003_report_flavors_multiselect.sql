-- Reports need to record more than one flavor per sighting, so replace the
-- single `flavor` text column with a `flavors` array.

alter table public.reports
  add column if not exists flavors text[] not null default '{}';

update public.reports
set flavors = array[flavor]
where flavor is not null and flavors = '{}';

alter table public.reports
  drop column if exists flavor;
