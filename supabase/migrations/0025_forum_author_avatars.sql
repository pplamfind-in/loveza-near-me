-- Store only the public profile photo; auth.users stays private.
alter table public.forum_threads add column author_avatar_url text;
alter table public.forum_comments add column author_avatar_url text;

create function public.set_forum_author_avatar()
returns trigger language plpgsql security definer set search_path = public
as $$
declare avatar text;
begin
  select coalesce(nullif(raw_user_meta_data->>'avatar_url', ''), nullif(raw_user_meta_data->>'picture', ''))
    into avatar from auth.users where id = new.author_id;
  new.author_avatar_url := case when avatar ~ '^https://' and char_length(avatar) <= 2048 then avatar else null end;
  return new;
end;
$$;
revoke all on function public.set_forum_author_avatar() from public, anon, authenticated;
create trigger forum_threads_avatar before insert or update on public.forum_threads
  for each row execute function public.set_forum_author_avatar();
create trigger forum_comments_avatar before insert or update on public.forum_comments
  for each row execute function public.set_forum_author_avatar();

-- Existing posts receive their authors' photos too.
update public.forum_threads set author_avatar_url = null;
update public.forum_comments set author_avatar_url = null;
notify pgrst, 'reload schema';
