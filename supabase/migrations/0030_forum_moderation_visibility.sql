alter table public.forum_threads add column is_hidden boolean not null default false;
alter table public.forum_comments add column is_hidden boolean not null default false;
grant update (is_hidden) on public.forum_threads, public.forum_comments to authenticated;

create function public.forum_thread_visible(thread uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.forum_threads where id = thread and not is_hidden);
$$;
create function public.forum_parent_visible(parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.forum_comments where id = parent and parent_id is null and not is_hidden and public.forum_thread_visible(thread_id));
$$;
revoke all on function public.forum_thread_visible(uuid), public.forum_parent_visible(uuid) from public;
grant execute on function public.forum_thread_visible(uuid), public.forum_parent_visible(uuid) to anon, authenticated;

create function public.guard_forum_visibility()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_hidden is distinct from old.is_hidden and not public.is_admin() then
    raise exception 'Only admins can change visibility' using errcode='42501';
  end if;
  return new;
end;
$$;
create trigger forum_threads_guard_visibility before update on public.forum_threads for each row execute function public.guard_forum_visibility();
create trigger forum_comments_guard_visibility before update on public.forum_comments for each row execute function public.guard_forum_visibility();

drop policy forum_threads_read on public.forum_threads;
create policy forum_threads_read on public.forum_threads for select using (not is_hidden or public.is_admin());
drop policy forum_comments_read on public.forum_comments;
create policy forum_comments_read on public.forum_comments for select using (
  public.is_admin() or (not is_hidden and public.forum_thread_visible(thread_id) and (parent_id is null or public.forum_parent_visible(parent_id)))
);
create policy forum_threads_moderate on public.forum_threads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy forum_comments_moderate on public.forum_comments for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy forum_comments_create on public.forum_comments;
create policy forum_comments_create on public.forum_comments for insert to authenticated with check (
  (select auth.uid()) = author_id and public.forum_thread_visible(thread_id) and (parent_id is null or public.forum_parent_visible(parent_id))
);
notify pgrst, 'reload schema';
