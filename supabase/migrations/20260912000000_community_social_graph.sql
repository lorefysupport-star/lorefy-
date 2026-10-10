-- Complete the public reader graph and make community changes observable.

drop policy if exists "Readers can view their own follows" on public.profile_follows;
drop policy if exists "Readers can view their connections" on public.profile_follows;
create policy "Readers can view their connections"
  on public.profile_follows for select to authenticated
  using ((select auth.uid()) in (follower_id, following_id));

create or replace function public.get_public_profile_social(profile_ref uuid)
returns table (
  id uuid,
  username text,
  name text,
  bio text,
  avatar text,
  banner text,
  genres jsonb,
  follower_count bigint,
  following_count bigint,
  is_following boolean,
  favorite_work_ids jsonb,
  favorite_character_ids jsonb,
  completed_count bigint
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select
    p.id,
    p.username,
    coalesce(p.name, ''),
    coalesce(p.bio, ''),
    p.avatar,
    p.banner,
    to_jsonb(p.genres),
    (select count(*) from public.profile_follows f where f.following_id = p.id),
    (select count(*) from public.profile_follows f where f.follower_id = p.id),
    exists (
      select 1 from public.profile_follows f
      where f.follower_id = auth.uid() and f.following_id = p.id
    ),
    case
      when jsonb_typeof((us.data ->> 'lorefy.user.favorites.v2')::jsonb) = 'array'
        then (us.data ->> 'lorefy.user.favorites.v2')::jsonb
      else '[]'::jsonb
    end,
    case
      when jsonb_typeof((us.data ->> 'lorefy.user.profileTopCharacters.v1')::jsonb) = 'array'
        then (us.data ->> 'lorefy.user.profileTopCharacters.v1')::jsonb
      else '[]'::jsonb
    end,
    (
      select count(*)
      from jsonb_each_text(
        case
          when jsonb_typeof((us.data ->> 'lorefy.user.library.v2')::jsonb) = 'object'
            then (us.data ->> 'lorefy.user.library.v2')::jsonb
          else '{}'::jsonb
        end
      ) entry
      where entry.value in ('تمت القراءة', 'مكتملة', 'completed', 'done', 'finished')
    )
  from public.profiles p
  left join public.user_state us on us.user_id = p.id
  where auth.uid() is not null
    and p.id = profile_ref
    and (
      p.id = auth.uid()
      or (
        p.is_private = false
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)
      )
    );
$$;

revoke all on function public.get_public_profile_social(uuid) from public, anon;
grant execute on function public.get_public_profile_social(uuid) to authenticated;

create or replace function public.list_profile_connections(
  profile_ref uuid,
  connection_kind text,
  result_limit integer default 100,
  result_offset integer default 0
)
returns table (
  id uuid,
  username text,
  name text,
  bio text,
  avatar text,
  genres jsonb,
  is_following boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, private, pg_temp
as $$
declare
  safe_limit integer := least(greatest(coalesce(result_limit, 100), 1), 200);
  safe_offset integer := least(greatest(coalesce(result_offset, 0), 0), 10000);
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if connection_kind not in ('followers', 'following') then
    raise exception 'invalid_connection_kind' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = profile_ref
      and (
        p.id = auth.uid()
        or (
          p.is_private = false
          and not private.author_has_blocked_viewer(p.id)
          and not private.reader_has_blocked_author(p.id)
        )
      )
  ) then
    return;
  end if;

  return query
    select
      p.id,
      p.username,
      coalesce(p.name, ''),
      coalesce(p.bio, ''),
      p.avatar,
      to_jsonb(p.genres),
      exists (
        select 1 from public.profile_follows mine
        where mine.follower_id = auth.uid() and mine.following_id = p.id
      ),
      f.created_at
    from public.profile_follows f
    join public.profiles p on p.id = case
      when connection_kind = 'followers' then f.follower_id
      else f.following_id
    end
    where (
      (connection_kind = 'followers' and f.following_id = profile_ref)
      or (connection_kind = 'following' and f.follower_id = profile_ref)
    )
      and (p.id = auth.uid() or p.is_private = false)
      and not private.author_has_blocked_viewer(p.id)
      and not private.reader_has_blocked_author(p.id)
    order by f.created_at desc
    limit safe_limit offset safe_offset;
end;
$$;

revoke all on function public.list_profile_connections(uuid, text, integer, integer) from public, anon;
grant execute on function public.list_profile_connections(uuid, text, integer, integer) to authenticated;

do $$
declare
  target text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach target in array array['reviews', 'review_comments', 'review_reactions', 'profile_follows'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
      ) then
        execute format('alter publication supabase_realtime add table public.%I', target);
      end if;
    end loop;
  end if;
end;
$$;
