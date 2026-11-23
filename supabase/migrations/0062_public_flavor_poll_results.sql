create function public.get_public_flavor_poll_results(target_poll_id uuid)
returns table (option_label text, vote_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select options.label, count(votes.poll_id)
  from public.flavor_polls as polls
  cross join lateral unnest(polls.options) with ordinality as options(label, position)
  left join public.flavor_poll_votes as votes
    on votes.poll_id = polls.id and votes.option_label = options.label
  where polls.id = target_poll_id
    and polls.activity_type = 'poll'
    and polls.is_published
    and (polls.starts_at is null or polls.starts_at <= statement_timestamp())
  group by options.label, options.position
  order by options.position;
$$;

revoke all on function public.get_public_flavor_poll_results(uuid) from public, anon, authenticated;
grant execute on function public.get_public_flavor_poll_results(uuid) to anon, authenticated;
