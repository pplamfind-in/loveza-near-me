alter table public.flavor_polls
  drop constraint flavor_polls_options_check,
  add constraint flavor_polls_options_check check (
    (activity_type = 'photo' and cardinality(options) = 0)
    or (activity_type = 'krathong' and cardinality(options) between 0 and 12)
    or (activity_type in ('poll', 'matching') and cardinality(options) between 2 and 12)
  );

update public.flavor_polls
  set options = array['บัวชมพู', 'ดาวเรือง', 'กล้วยไม้']
  where activity_type = 'krathong' and cardinality(options) = 0;

alter table public.activity_krathongs
  drop constraint activity_krathongs_design_check,
  add constraint activity_krathongs_design_check check (
    design in ('lotus', 'marigold', 'orchid')
    or (starts_with(design, 'custom:') and char_length(design) between 8 and 87)
  ),
  add column image_url text;

create or replace function public.launch_activity_krathong(target_activity_id uuid, chosen_design text, wish_text text)
returns public.activity_krathongs
language plpgsql
security definer
set search_path = ''
as $$
declare
  launched public.activity_krathongs;
  design_name text := case chosen_design
    when 'lotus' then 'บัวชมพู'
    when 'marigold' then 'ดาวเรือง'
    when 'orchid' then 'กล้วยไม้'
    else case when starts_with(chosen_design, 'custom:') then substr(chosen_design, 8) end
  end;
  design_image_url text;
  clean_wish text := btrim(coalesce(wish_text, ''));
begin
  if design_name is null or char_length(design_name) not between 1 and 80
    or char_length(clean_wish) > 200 then
    raise exception 'Invalid krathong' using errcode = '22023';
  end if;

  -- Serialize launches per activity to bound anonymous write volume.
  perform pg_advisory_xact_lock(hashtextextended('krathong:' || target_activity_id::text, 0));
  perform 1 from public.flavor_polls activity
    where activity.id = target_activity_id and activity.activity_type = 'krathong'
      and activity.is_published and activity.is_active
      and (activity.starts_at is null or activity.starts_at <= clock_timestamp())
      and (activity.ends_at is null or activity.ends_at > clock_timestamp())
    for share;
  if not found then
    raise exception 'Krathong activity is closed' using errcode = 'P0001';
  end if;

  select nullif(activity.option_details -> design_name ->> 'imageUrl', '')
    into design_image_url
    from public.flavor_polls activity
    where activity.id = target_activity_id and design_name = any(activity.options);
  if not found then
    raise exception 'Invalid krathong' using errcode = '22023';
  end if;

  if (select count(*) from public.activity_krathongs
      where activity_id = target_activity_id
        and created_at > clock_timestamp() - interval '1 second') >= 20 then
    raise exception 'Too many krathongs' using errcode = 'P0002';
  end if;

  insert into public.activity_krathongs (activity_id, design, image_url)
    values (target_activity_id, chosen_design, design_image_url) returning * into launched;
  if clean_wish <> '' then
    insert into public.activity_krathong_wishes (krathong_id, wish)
      values (launched.id, clean_wish);
  end if;
  return launched;
end;
$$;
