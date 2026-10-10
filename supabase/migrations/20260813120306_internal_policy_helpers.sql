-- Keep RLS helper functions outside the PostgREST-exposed public schema.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_active_auth_user()
returns boolean
language sql stable security definer
set search_path = pg_catalog, auth
as $$
  select auth.uid() is not null
    and exists (select 1 from auth.users where id = auth.uid());
$$;

create or replace function private.author_has_blocked_viewer(author_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profile_blocks
    where blocker_id = author_id and blocked_id = auth.uid()
  );
$$;

create or replace function private.reader_has_blocked_author(author_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profile_blocks
    where blocker_id = auth.uid() and blocked_id = author_id
  );
$$;

revoke all on function private.is_active_auth_user() from public, anon;
revoke all on function private.author_has_blocked_viewer(uuid) from public, anon;
revoke all on function private.reader_has_blocked_author(uuid) from public, anon;
grant execute on function private.is_active_auth_user() to authenticated;
grant execute on function private.author_has_blocked_viewer(uuid) to authenticated;
grant execute on function private.reader_has_blocked_author(uuid) to authenticated;

drop policy if exists "profile media owner write" on storage.objects;
create policy "profile media owner write" on storage.objects for insert to authenticated
with check (
  private.is_active_auth_user()
  and bucket_id = 'profile-media'
  and name ~ ('^' || (select auth.uid())::text || '/(avatar|banner)[.](jpg|png|webp)$')
);

drop policy if exists "profile media owner update" on storage.objects;
create policy "profile media owner update" on storage.objects for update to authenticated
using (
  private.is_active_auth_user() and bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  private.is_active_auth_user() and bucket_id = 'profile-media'
  and name ~ ('^' || (select auth.uid())::text || '/(avatar|banner)[.](jpg|png|webp)$')
);

drop policy if exists "review media owner write" on storage.objects;
create policy "review media owner write" on storage.objects for insert to authenticated
with check (
  private.is_active_auth_user()
  and bucket_id = 'review-media'
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+[.](jpg|png|webp)$')
);

drop policy if exists "review media owner update" on storage.objects;
create policy "review media owner update" on storage.objects for update to authenticated
using (
  private.is_active_auth_user() and bucket_id = 'review-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  private.is_active_auth_user()
  and bucket_id = 'review-media'
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+[.](jpg|png|webp)$')
);

drop policy if exists "custom covers owner insert" on storage.objects;
create policy "custom covers owner insert" on storage.objects for insert to authenticated
with check (
  private.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "custom covers owner update" on storage.objects;
create policy "custom covers owner update" on storage.objects for update to authenticated
using (
  private.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  private.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Community reviews respect account blocks" on public.reviews;
create policy "Community reviews respect account blocks"
  on public.reviews for select to authenticated
  using (
    (is_public or user_id = (select auth.uid()))
    and not private.author_has_blocked_viewer(user_id)
    and not private.reader_has_blocked_author(user_id)
  );

drop policy if exists "Community comments respect account blocks" on public.review_comments;
create policy "Community comments respect account blocks"
  on public.review_comments for select to authenticated
  using (
    not is_deleted
    and not private.author_has_blocked_viewer(user_id)
    and not private.reader_has_blocked_author(user_id)
  );

drop policy if exists "Public profiles respect account blocks" on public.profiles;
create policy "Public profiles respect account blocks"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (
      is_private = false
      and not private.author_has_blocked_viewer(id)
      and not private.reader_has_blocked_author(id)
    )
  );

create or replace function public.search_public_profiles(search_text text, result_limit integer default 20)
returns table (id uuid, username text, name text, bio text, avatar text, genres jsonb)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  query_text text := lower(trim(coalesce(search_text, '')));
  safe_limit integer := least(greatest(coalesce(result_limit, 20), 1), 20);
begin
  if auth.uid() is null or char_length(query_text) < 2 or char_length(query_text) > 64 then return; end if;
  return query
    select p.id, p.username, coalesce(p.name, ''), coalesce(p.bio, ''), p.avatar, to_jsonb(p.genres)
    from public.profiles p
    where p.is_private = false and p.username is not null and p.username <> ''
      and not private.author_has_blocked_viewer(p.id)
      and not private.reader_has_blocked_author(p.id)
      and (
        position(query_text in lower(p.username)) > 0
        or position(query_text in lower(coalesce(p.name, ''))) > 0
      )
    order by case when lower(p.username) = query_text then 0 else 1 end,
      case when position(query_text in lower(p.username)) = 1 then 0 else 1 end,
      p.updated_at desc
    limit safe_limit;
end;
$$;

drop function if exists public.is_active_auth_user();
drop function if exists public.author_has_blocked_viewer(uuid);
drop function if exists public.reader_has_blocked_author(uuid);
