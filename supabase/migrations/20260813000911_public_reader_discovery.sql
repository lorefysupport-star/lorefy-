-- Public reader discovery with a deliberately narrow response shape.
-- Apply after 20260722000000_account_foundation.sql.

create table if not exists public.profile_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint profile_follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists profile_follows_follower_created_idx
  on public.profile_follows (follower_id, created_at desc);

alter table public.profile_follows enable row level security;
revoke all on table public.profile_follows from anon;
grant select, insert, delete on table public.profile_follows to authenticated;

drop policy if exists "Readers can view their own follows" on public.profile_follows;
create policy "Readers can view their own follows"
  on public.profile_follows for select to authenticated
  using ((select auth.uid()) = follower_id);

drop policy if exists "Readers can follow profiles themselves" on public.profile_follows;
create policy "Readers can follow profiles themselves"
  on public.profile_follows for insert to authenticated
  with check ((select auth.uid()) = follower_id and follower_id <> following_id);

drop policy if exists "Readers can remove their own follows" on public.profile_follows;
create policy "Readers can remove their own follows"
  on public.profile_follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

create or replace function public.search_public_profiles(search_text text, result_limit integer default 20)
returns table (
  id uuid,
  username text,
  name text,
  bio text,
  avatar text,
  genres jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  query_text text := lower(trim(coalesce(search_text, '')));
  escaped_pattern text;
  safe_limit integer := least(greatest(coalesce(result_limit, 20), 1), 20);
begin
  if char_length(query_text) < 2 or char_length(query_text) > 64 then
    return;
  end if;

  escaped_pattern := '%' || replace(replace(replace(query_text, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';
  return query
    select p.id, p.username, p.name, p.bio, p.avatar, p.genres
    from public.profiles p
    where p.username is not null
      and p.username <> ''
      and (lower(p.username) like escaped_pattern escape E'\\' or lower(p.name) like escaped_pattern escape E'\\')
    order by
      case when lower(p.username) = query_text then 0 else 1 end,
      case when lower(p.username) like query_text || '%' then 0 else 1 end,
      p.updated_at desc
    limit safe_limit;
end;
$$;

revoke all on function public.search_public_profiles(text, integer) from public, anon;
grant execute on function public.search_public_profiles(text, integer) to authenticated;
