# Supabase setup for SlideAI Studio

SlideAI Studio uses Supabase as its hosted backend. You do **not** need to install PostgreSQL on your computer.

## 1. Create / open a Supabase project

Open https://supabase.com/dashboard and create a project if you do not already have one. Wait for the database to finish provisioning.

## 2. Create the database tables and security policies

1. Open **SQL Editor** in your Supabase project.
2. Open `supabase/schema.sql` from this repository.
3. Paste the complete SQL into a new SQL query and run it once.

This creates:
- `presentations` — the presentation metadata and editable slide JSON.
- `presentation_folders` — user-owned folders.
- `presentation_versions` — periodic recoverable snapshots.
- Private `presentation-assets` Storage bucket.
- Row Level Security policies that restrict each record and asset to its owner.

The SQL is safe to re-run for the policies, triggers, and bucket. Do not run it against a production project that already has custom tables with these names without reviewing it first.

## 3. Enable the tables in the Data API

Supabase changed the default exposure behavior for newly created tables. In your project, open **Integrations → Data API** (or **Project Settings → API → Data API**) and make sure the `public` schema and these tables are exposed to the Data API:
- `presentations`
- `presentation_folders`
- `presentation_versions`

The SQL already grants the minimum required privileges to the `authenticated` role and enables RLS. Do not grant anonymous access to these tables.

## 4. Add the public project settings

In **Project Settings → API Keys** or the project's **Connect** dialog, copy:
- Project URL
- Publishable key (starts with `sb_publishable_`)

Create `apps/web/.env.local` (do not commit this file):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

For Vercel, add the same two variables in **Project → Settings → Environment Variables** for Preview and Production, then redeploy.

**Never put the secret key or legacy service_role key in a NEXT_PUBLIC variable or browser code.**

## 5. Configure authentication

In **Authentication → URL Configuration**, set your local Site URL to `http://localhost:3000`. Add your deployed domain to the Redirect URLs list. Configure email confirmation and SMTP according to your launch requirements.

## 6. Run the app

From the repository root:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Create an account, confirm the email if confirmation is enabled, and sign in.

## What is synced

- The editor keeps a local browser backup and debounces cloud autosaves.
- Cloud presentations are stored in PostgreSQL as JSONB project data.
- A five-minute snapshot trigger records previous project states when content changes.
- Deleting a presentation moves it to Trash. Restore it from Trash or permanently delete it.
- Existing local browser projects are imported into the signed-in account the first time the dashboard loads after sign-in.

Large binary assets belong in Supabase Storage, not in PostgreSQL rows. The private bucket and owner-only policies are provisioned here; the current editor autosaves its serialized project data, and moving embedded/base64 image payloads into Storage is a separate asset-migration enhancement.
