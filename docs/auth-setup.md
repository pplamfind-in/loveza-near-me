# Loveza authentication setup

The application uses Supabase Auth for both user types. Sessions are stored and refreshed through Supabase SSR cookies.

## Required environment variables

Copy the keys from `.env.example` into `.env.local` or configure them in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
ADMIN_USERNAME=
ADMIN_EMAIL=
```

`ADMIN_USERNAME` and `ADMIN_EMAIL` are server-only. The admin password is managed by Supabase Auth and must never be stored in the repository.

## Google login

1. Create a Google OAuth 2.0 Web Client ID and set it as `GOOGLE_CLIENT_ID`.
2. Add the application origins in Google Cloud, for example `http://localhost:3300` and the production origin.
3. Enable the Google provider in Supabase Authentication > Providers using the same Client ID.
4. The page receives a Google ID token directly through Google Identity Services and exchanges it for a Supabase session with `signInWithIdToken`; no application callback route or Google client secret is used by the frontend.

## Admin account

1. Create the admin email/password account in Supabase Authentication.
2. Set `ADMIN_EMAIL` to that email and choose a separate `ADMIN_USERNAME` for the login form.
3. Add the protected role to the account with the Supabase SQL editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"admin"}'::jsonb
where email = 'replace-with-admin-email@example.com';
```

Admin authorization is checked from `app_metadata.role` by both `src/proxy.ts` and the `/admin` Server Component.

## Cookie behavior

- Supabase authentication cookies are essential and remain available when the visitor chooses "เฉพาะที่จำเป็น".
- Cookie consent is stored for one year as `loveza_cookie_consent` with `SameSite=Lax` and `Secure` on HTTPS.
- Optional analytics or marketing scripts must only load when the consent value is `all`.
