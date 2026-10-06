-- Prefer a user-selected display name over the Google account name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, role)
  values (
    new.id,
    coalesce(
      nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.email,
    case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    role = case
      when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;


-- Refresh existing public author labels when the profile name changes.
create function public.sync_forum_display_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.display_name is distinct from old.display_name then
    update public.forum_threads set author_name = left(coalesce(nullif(btrim(new.display_name), ''), 'สมาชิก Loveza'), 100)
      where author_id = new.id and author_name is distinct from left(coalesce(nullif(btrim(new.display_name), ''), 'สมาชิก Loveza'), 100);
    update public.forum_comments set author_name = left(coalesce(nullif(btrim(new.display_name), ''), 'สมาชิก Loveza'), 100)
      where author_id = new.id and author_name is distinct from left(coalesce(nullif(btrim(new.display_name), ''), 'สมาชิก Loveza'), 100);
  end if;
  return new;
end;
$$;
revoke all on function public.sync_forum_display_name() from public, anon, authenticated;
create trigger profiles_sync_forum_name after update of display_name on public.profiles
  for each row execute function public.sync_forum_display_name();

update public.profiles p set display_name = left(btrim(u.raw_user_meta_data ->> 'display_name'), 60)
  from auth.users u where p.id = u.id and nullif(btrim(u.raw_user_meta_data ->> 'display_name'), '') is not null;
notify pgrst, 'reload schema';
