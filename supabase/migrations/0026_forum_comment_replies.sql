-- One level of replies, constrained to a root comment in the same thread.
alter table public.forum_comments add column parent_id uuid;
alter table public.forum_comments add constraint forum_comments_id_thread_key unique (id, thread_id);
alter table public.forum_comments add constraint forum_comments_parent_fkey
  foreign key (parent_id, thread_id) references public.forum_comments(id, thread_id) on delete cascade;
alter table public.forum_comments add constraint forum_comments_not_self_reply check (parent_id is distinct from id);
create index forum_comments_parent_created_idx on public.forum_comments (thread_id, parent_id, created_at, id);
grant insert (parent_id) on public.forum_comments to authenticated;

create function public.validate_forum_reply()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.forum_comments where id = new.parent_id and thread_id = new.thread_id and parent_id is null
  ) then
    raise exception 'Reply must reference a root comment in the same thread' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger forum_comments_validate_reply before insert or update on public.forum_comments
  for each row execute function public.validate_forum_reply();
notify pgrst, 'reload schema';
create function public.forum_reply_counts(comment_ids uuid[])
returns table (parent_id uuid, reply_count bigint)
language sql stable security invoker set search_path = public as $$
  select parent_id, count(*) from public.forum_comments
  where parent_id = any(comment_ids) group by parent_id;
$$;
revoke all on function public.forum_reply_counts(uuid[]) from public;
grant execute on function public.forum_reply_counts(uuid[]) to anon, authenticated;
notify pgrst, 'reload schema';
