# Supabase

This directory holds the SQL schema for the Soldex database.

## Setup (one-time, manual, via Supabase dashboard)

1. Create a new Supabase project (Singapore region recommended; free tier).
2. In **Project Settings → API**, copy:
   - Project URL → set as `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars (and `.env.local`).
   - `anon` public key → set as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `service_role` secret key → set as `SUPABASE_SERVICE_ROLE_KEY` **locally only**
     (used by `scripts/migrate_to_supabase.ts`; never commit, never expose to the browser).
3. Open the **SQL Editor**, paste the entire contents of `migrations/0001_init.sql`,
   and run it.
4. Create the two app users in **Auth → Users → Add user → Create new user**:
   - Email: `esa@soldex.local`         · Password: (set & share securely)
   - Email: `ibrathiel@soldex.local`   · Password: (set & share securely)
   - Make sure "Auto Confirm User" is on so they can sign in immediately.
5. Run the importer once: `npx tsx scripts/migrate_to_supabase.ts`.

## Auth pattern

The app uses a fake-email convention: the user types just their username
(`esa`, `ibrathiel`) on the login page and the client appends
`@soldex.local` before calling `signInWithPassword`. There is no public
signup; the dashboard is the only way to add a user.

## RLS summary

| Table             | Anon (public) | Authenticated |
|-------------------|---------------|---------------|
| brands            | read          | full CRUD     |
| foams             | read          | full CRUD     |
| shoes             | read (non-deleted only) | full CRUD incl. trash |
| shoe_categories   | read (only for non-deleted shoes) | full CRUD |
| shoe_revisions    | none          | read          |

Soft delete: `deleted_at` timestamp on shoes. Trash page lets authed users
restore. Revision rows are emitted automatically by triggers and are
never editable from the client.
