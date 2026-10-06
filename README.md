## Prerequisites

- Node.js >=22 (Recommended)

## Installation

**Using Yarn (Recommended)**

```sh
yarn install
yarn dev
```

**Using Npm**

```sh
npm i
npm run dev
```

## Build

```sh
yarn build
# or
npm run build
```

## Mock server

By default we provide demo data from : `https://api-dev-minimal-[version].vercel.app`

To set up your local server:

- **Guide:** [https://docs.minimals.cc/mock-server](https://docs.minimals.cc/mock-server).

- **Resource:** [Download](https://www.dropbox.com/scl/fo/bopqsyaatc8fbquswxwww/AKgu6V6ZGmxtu22MuzsL5L4?rlkey=8s55vnilwz2d8nsrcmdo2a6ci&dl=0).

## Full version

- Create React App ([migrate to CRA](https://docs.minimals.cc/migrate-to-cra/)).
- Next.js
- Vite.js

## Starter version

- To remove unnecessary components. This is a simplified version ([https://starter.minimals.cc/](https://starter.minimals.cc/))
- Good to start a new project. You can copy components from the full version.
- Make sure to install the dependencies exactly as compared to the full version.

---

**NOTE:**
_When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly._

## Discussion forum

The user navigation includes `/forum/` and `/forum/[id]/`. Visitors can read;
Google-authenticated members can create threads, comments and one-level replies, edit their own
content, and delete it after confirmation. Threads have four categories and
thread lists are paginated; comments load in batches of 30 as you scroll, with
a manual load button and retry on errors. Updates use Server Actions and
page revalidation; no WebSocket server is required.

For a new database, apply `supabase/migrations/0024_discussion_forum.sql` after
the existing migrations using Supabase SQL Editor or your migration workflow.
It creates `forum_threads` and `forum_comments`, enables RLS, restricts writes
to authenticated authors, and prevents ownership changes through column grants.
Deleting a thread also deletes its comments. The UI renders plain text and
shows public display names without exposing account email addresses.

Apply `0025_forum_author_avatars.sql` and `0026_forum_comment_replies.sql` after
`0024` for profile photos and replies. Replies load independently in batches of
30. Deleting a parent comment deletes its replies after confirmation.

Apply `0028_forum_thread_images.sql` to enable one optional thread image.
Authors can submit JPG, PNG or WEBP up to 5MB. New uploads are converted to
WebP and limited to 2MB before storage (apply `0029_forum_image_size_limit.sql`).
Authors can replace or remove the image while editing,
and delete the associated file when deleting a thread. Images are public;
Storage writes are restricted to each author's folder. Server Actions accept
up to 6MB per request to accommodate the file and form fields.

Apply `0030_forum_moderation_visibility.sql` for admin hide/unhide controls.
Hidden threads and their comments are excluded from public reads by RLS;
hidden parent comments also conceal their replies. Admins can still inspect
all content and restore visibility. Independently hidden replies stay hidden
when the parent is restored. Only admins can change visibility.
