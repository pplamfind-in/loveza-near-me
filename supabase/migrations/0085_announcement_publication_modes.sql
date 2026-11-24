alter table public.system_announcements
  alter column publish_at drop not null,
  drop constraint system_announcements_content_html_check,
  add constraint system_announcements_content_html_check
    check (char_length(content_html) <= 100000
      and (publish_at is null or char_length(content_html) > 0));

notify pgrst, 'reload schema';
