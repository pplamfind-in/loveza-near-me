-- Keep the canonical store coordinates in sync when an admin corrects an
-- already-approved report in the Supabase dashboard.

create or replace function public.sync_approved_report_store_coordinates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.latitude not between -90 and 90
    or new.longitude not between -180 and 180 then
    raise exception 'Invalid store coordinates';
  end if;

  if new.approval_status = 'approved' and new.store_id is not null then
    update public.stores
    set
      latitude = new.latitude,
      longitude = new.longitude,
      updated_at = now()
    where id = new.store_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_approved_report_store_coordinates on public.reports;
create trigger sync_approved_report_store_coordinates
after update of latitude, longitude on public.reports
for each row
when (
  old.latitude is distinct from new.latitude
  or old.longitude is distinct from new.longitude
)
execute function public.sync_approved_report_store_coordinates();

revoke all on function public.sync_approved_report_store_coordinates() from public;
