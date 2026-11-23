create table public.admin_gmail_smtp_settings (
  id boolean primary key default true check (id),
  email text not null,
  encrypted_password text not null
);

alter table public.admin_gmail_smtp_settings enable row level security;
revoke all on public.admin_gmail_smtp_settings from anon, authenticated;
grant select, insert, update on public.admin_gmail_smtp_settings to authenticated;

create policy "Admins manage Gmail SMTP settings"
  on public.admin_gmail_smtp_settings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
