# ตามหา Loveza

Mobile-first web app for finding stores that have Loveza in stock, and reporting sightings when you find one. Built with Next.js App Router, TypeScript, MUI, and Supabase.

## Prerequisites

- Node.js >=22
- A Supabase project (URL + anon key in `.env`)

## Setup

```sh
npm install
```

Run the database migration once against your Supabase project (SQL editor or `supabase db push`):

```
supabase/migrations/0001_init_loveza_schema.sql
```

That migration also creates the `report-images` storage bucket and RLS policies. To make yourself an admin (for `/admin`), sign up a user through Supabase Auth, then run:

```sql
insert into public.profiles (id, role) values ('<auth-user-uuid>', 'admin')
on conflict (id) do update set role = 'admin';
```

## Development

```sh
npm run dev
```

Runs on [http://localhost:3300](http://localhost:3300).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run type-check` — TypeScript, no emit
- `npm run fm:check` / `npm run fm:fix` — Prettier

## Routes

`/` · `/nearby` · `/store/[id]` · `/report` · `/latest` · `/admin`
