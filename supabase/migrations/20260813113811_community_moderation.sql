-- Server-side community moderation and account-level blocking.

create or replace function public.moderate_community_text()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  row_data jsonb := to_jsonb(new);
  candidate text := lower(trim(concat_ws(' ', row_data ->> 'name', row_data ->> 'bio', row_data ->> 'body')));
begin
  if candidate ~ '(^|[^[:alnum:]_])(kill yourself|go kill yourself|kys|rape|child porn|nazi|انتحر|اقتل نفسك|اغتصاب|اباحية اطفال)([^[:alnum:]_]|$)' then
    raise exception 'community_content_rejected' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists moderate_reviews_text on public.reviews;
create trigger moderate_reviews_text
before insert or update of body on public.reviews
for each row execute function public.moderate_community_text();

drop trigger if exists moderate_review_comments_text on public.review_comments;
create trigger moderate_review_comments_text
before insert or update of body on public.review_comments
for each row execute function public.moderate_community_text();

drop trigger if exists moderate_profiles_text on public.profiles;
create trigger moderate_profiles_text
before insert or update of name, bio on public.profiles
for each row execute function public.moderate_community_text();

revoke all on function public.moderate_community_text() from public, anon, authenticated;

create table if not exists public.profile_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint profile_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists profile_blocks_blocked_idx
  on public.profile_blocks (blocked_id, created_at desc);

alter table public.profile_blocks enable row level security;
revoke all on public.profile_blocks from public, anon;
grant select, insert, delete on public.profile_blocks to authenticated;

drop policy if exists "Readers can view their own blocks" on public.profile_blocks;
create policy "Readers can view their own blocks"
  on public.profile_blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);

drop policy if exists "Readers can block profiles themselves" on public.profile_blocks;
create policy "Readers can block profiles themselves"
  on public.profile_blocks for insert to authenticated
  with check ((select auth.uid()) = blocker_id and blocker_id <> blocked_id);

drop policy if exists "Readers can remove their own blocks" on public.profile_blocks;
create policy "Readers can remove their own blocks"
  on public.profile_blocks for delete to authenticated
  using ((select auth.uid()) = blocker_id);

create or replace function public.author_has_blocked_viewer(author_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profile_blocks
    where blocker_id = author_id and blocked_id = auth.uid()
  );
$$;

create or replace function public.reader_has_blocked_author(author_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profile_blocks
    where blocker_id = auth.uid() and blocked_id = author_id
  );
$$;

revoke all on function public.author_has_blocked_viewer(uuid) from public, anon;
revoke all on function public.reader_has_blocked_author(uuid) from public, anon;
grant execute on function public.author_has_blocked_viewer(uuid) to authenticated;
grant execute on function public.reader_has_blocked_author(uuid) to authenticated;

drop policy if exists "reviews read public or own" on public.reviews;
drop policy if exists "Community reviews respect account blocks" on public.reviews;
create policy "Community reviews respect account blocks"
  on public.reviews for select to authenticated
  using (
    (is_public or user_id = (select auth.uid()))
    and not public.author_has_blocked_viewer(user_id)
    and not public.reader_has_blocked_author(user_id)
  );

drop policy if exists "review comments read" on public.review_comments;
drop policy if exists "Community comments respect account blocks" on public.review_comments;
create policy "Community comments respect account blocks"
  on public.review_comments for select to authenticated
  using (
    not is_deleted
    and not public.author_has_blocked_viewer(user_id)
    and not public.reader_has_blocked_author(user_id)
  );

drop policy if exists "profiles read" on public.profiles;
drop policy if exists "Public profiles respect account blocks" on public.profiles;
create policy "Public profiles respect account blocks"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (
      is_private = false
      and not public.author_has_blocked_viewer(id)
      and not public.reader_has_blocked_author(id)
    )
  );

create or replace function public.search_public_profiles(search_text text, result_limit integer default 20)
returns table (id uuid, username text, name text, bio text, avatar text, genres jsonb)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  query_text text := lower(trim(coalesce(search_text, ''));
  escaped_pattern text;
  safe_limit integer := least(greatest(coalesce(result_limit, 20), 1), 20);
begin
  if auth.uid() is null or char_length(query_text) < 2 or char_length(query_text) > 64 then return; end if;
  escaped_pattern := '%' || replace(replace(replace(query_text, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';
  return query
    select p.id, p.username, coalesce(p.name, ''), coalesce(p.bio, ''), p.avatar, to_jsonb(p.genres)
    from public.profiles p
    where p.is_private = false and p.username is not null and p.username <> ''
      and not public.author_has_blocked_viewer(p.id)
      and not public.reader_has_blocked_author(p.id)
      and (lower(p.username) like escaped_pattern escape E'\\' or lower(coalesce(p.name, '')) like escaped_pattern escape E'\\')
    order by case when lower(p.username) = query_text then 0 else 1 end,
      case when lower(p.username) like query_text || '%' then 0 else 1 end,
      p.updated_at desc
    limit safe_limit;
end;
$$;

revoke all on function public.search_public_profiles(text, integer) from public, anon;
grant execute on function public.search_public_profiles(text, integer) to authenticated;
