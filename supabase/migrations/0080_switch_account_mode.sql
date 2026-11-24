grant update (kind) on public.account_types to authenticated;

create policy account_types_change_own_mode on public.account_types
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

notify pgrst, 'reload schema';
