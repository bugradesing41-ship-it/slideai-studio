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

## 5. Configure Google sign-in

1. In Google Cloud Console, create or select a project and configure the **OAuth consent screen**.
2. Create an **OAuth Client ID → Web application**.
3. In **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - Your deployed app origin, for example `https://your-domain.com`
4. In **Authorized redirect URIs**, add the Supabase callback shown in **Supabase → Authentication → Providers → Google**. It has this format:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy the Google Client ID and Client Secret into **Supabase → Authentication → Providers → Google**, enable the provider, and save.
6. In **Supabase → Authentication → URL Configuration**:
   - Set **Site URL** to your deployed app origin.
   - Add `http://localhost:3000/` to Redirect URLs.
   - Add your production and preview callback URLs as exact origins/paths you actually use (for example `https://your-domain.com/`).
7. The app starts Google OAuth with `redirectTo: window.location.origin + "/"`; Supabase JS completes the PKCE callback and restores the browser session on return.

Keep the Google Client Secret only in Supabase. Never place it in `.env.local`, frontend code, or a `NEXT_PUBLIC_*` variable. The app's Google button cannot work until the provider is enabled and these URLs match exactly.

For email confirmation and password recovery, configure SMTP and the corresponding redirect URLs according to your launch requirements.

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
