-- Lorefy account foundation.
-- Apply this migration only after the Supabase project is restored and reviewed.
-- The browser never receives a service-role key; all rows are owner-scoped.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  name text not null default '',
  bio text not null default '',
  avatar text,
  banner text,
  genres jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
grant select, insert, update, delete on table public.profiles to authenticated;

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Profiles can be created by their owner" on public.profiles;
create policy "Profiles can be created by their owner"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Profiles can be edited by their owner" on public.profiles;
create policy "Profiles can be edited by their owner"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Profiles can be deleted by their owner" on public.profiles;
create policy "Profiles can be deleted by their owner"
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = id);

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_state enable row level security;
revoke all on table public.user_state from anon;
grant select, insert, update, delete on table public.user_state to authenticated;

drop policy if exists "Users can read their own state" on public.user_state;
create policy "Users can read their own state"
  on public.user_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own state" on public.user_state;
create policy "Users can create their own state"
  on public.user_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own state" on public.user_state;
create policy "Users can update their own state"
  on public.user_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own state" on public.user_state;
create policy "Users can delete their own state"
  on public.user_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile media is readable by its owner" on storage.objects;
create policy "Profile media is readable by its owner"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Profile media can be uploaded by its owner" on storage.objects;
create policy "Profile media can be uploaded by its owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Profile media can be replaced by its owner" on storage.objects;
create policy "Profile media can be replaced by its owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Profile media can be deleted by its owner" on storage.objects;
create policy "Profile media can be deleted by its owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
