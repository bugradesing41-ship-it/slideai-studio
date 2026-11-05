-- SlideAI Studio cloud workspace schema
-- Run once in Supabase Dashboard > SQL Editor.
-- All user-owned rows are protected by RLS. No service-role key is used by the browser.

create extension if not exists pgcrypto;

create table if not exists public.presentation_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.presentation_folders(id) on delete set null,
  title text not null default 'Untitled presentation' check (char_length(title) <= 120),
  description text not null default '' check (char_length(description) <= 500),
  canvas_width integer not null default 1280 check (canvas_width between 320 and 4096),
  canvas_height integer not null default 720 check (canvas_height between 320 and 4096),
  project_data jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.presentation_versions (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  project_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists presentations_user_updated_idx
  on public.presentations(user_id, updated_at desc) where deleted_at is null;
create index if not exists presentations_user_deleted_idx
  on public.presentations(user_id, deleted_at desc) where deleted_at is not null;
create index if not exists presentations_folder_idx on public.presentations(folder_id);
create index if not exists presentation_versions_lookup_idx
  on public.presentation_versions(presentation_id, created_at desc);

create or replace function public.set_workspace_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
before update on public.presentations
for each row execute function public.set_workspace_updated_at();

drop trigger if exists folders_set_updated_at on public.presentation_folders;
create trigger folders_set_updated_at
before update on public.presentation_folders
for each row execute function public.set_workspace_updated_at();

-- Keep a recoverable snapshot at most once every five minutes when meaningful content changes.
create or replace function public.snapshot_presentation_version()
returns trigger language plpgsql set search_path = public
as $$
declare
  latest_snapshot timestamptz;
begin
  if new.project_data is distinct from old.project_data then
    select max(created_at) into latest_snapshot
    from public.presentation_versions
    where presentation_id = old.id and user_id = old.user_id;

    if latest_snapshot is null or latest_snapshot < now() - interval '5 minutes' then
      insert into public.presentation_versions (presentation_id, user_id, title, project_data)
      values (old.id, old.user_id, old.title, old.project_data);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists presentations_version_before_update on public.presentations;
create trigger presentations_version_before_update
before update on public.presentations
for each row execute function public.snapshot_presentation_version();

alter table public.presentation_folders enable row level security;
alter table public.presentations enable row level security;
alter table public.presentation_versions enable row level security;

drop policy if exists "Users manage their own folders" on public.presentation_folders;
create policy "Users manage their own folders" on public.presentation_folders
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own presentations" on public.presentations;
create policy "Users manage their own presentations" on public.presentations
for all to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    folder_id is null
    or exists (
      select 1 from public.presentation_folders f
      where f.id = folder_id and f.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users read their own presentation versions" on public.presentation_versions;
create policy "Users read their own presentation versions" on public.presentation_versions
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their own presentation versions" on public.presentation_versions;
create policy "Users insert their own presentation versions" on public.presentation_versions
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.presentations p
    where p.id = presentation_id and p.user_id = (select auth.uid())
  )
);

drop policy if exists "Users delete their own presentation versions" on public.presentation_versions;
create policy "Users delete their own presentation versions" on public.presentation_versions
for delete to authenticated
using ((select auth.uid()) = user_id);

-- Explicit grants are required for projects where public-schema tables are not auto-exposed.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.presentation_folders to authenticated;
grant select, insert, update, delete on public.presentations to authenticated;
grant select, insert, delete on public.presentation_versions to authenticated;

-- Private bucket for future uploaded presentation assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('presentation-assets', 'presentation-assets', false, 52428800,
  array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Users read own presentation assets" on storage.objects;
create policy "Users read own presentation assets" on storage.objects
for select to authenticated
using (bucket_id = 'presentation-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users upload own presentation assets" on storage.objects;
create policy "Users upload own presentation assets" on storage.objects
for insert to authenticated
with check (bucket_id = 'presentation-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users update own presentation assets" on storage.objects;
create policy "Users update own presentation assets" on storage.objects
for update to authenticated
using (bucket_id = 'presentation-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'presentation-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users delete own presentation assets" on storage.objects;
create policy "Users delete own presentation assets" on storage.objects
for delete to authenticated
using (bucket_id = 'presentation-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
