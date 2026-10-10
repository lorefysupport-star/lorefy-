+-- Expose a privacy-gated reading summary for the full public profile.
-- Account-owned raw state remains accessible only through this authenticated RPC.

drop function if exists public.get_public_profile_social(uuid);

create function public.get_public_profile_social(profile_ref uuid)
returns table (
  id uuid,
  username text,
  name text,
  bio text,
  avatar text,
  banner text,
  genres jsonb,
  social_links jsonb,
  follower_count bigint,
  following_count bigint,
  is_following boolean,
  favorite_work_ids jsonb,
  favorite_character_ids jsonb,
  completed_count bigint,
  total_chapters bigint,
  read_hours bigint,
  library_entries jsonb
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  with profile_snapshot as (
    select
      p.id,
      p.username,
      coalesce(p.name, '') as name,
      coalesce(p.bio, '') as bio,
      p.avatar,
      p.banner,
      to_jsonb(p.genres) as genres,
      coalesce(p.social_links, '{}'::jsonb) as social_links,
      case
        when jsonb_typeof((us.data ->> 'lorefy.user.favorites.v2')::jsonb) = 'array'
          then (us.data ->> 'lorefy.user.favorites.v2')::jsonb
        else '[]'::jsonb
      end as favorite_work_ids,
      case
        when jsonb_typeof((us.data ->> 'lorefy.user.profileTopCharacters.v1')::jsonb) = 'array'
          then (us.data ->> 'lorefy.user.profileTopCharacters.v1')::jsonb
        else '[]'::jsonb
      end as favorite_character_ids,
      case
        when jsonb_typeof((us.data ->> 'lorefy.user.library.v2')::jsonb) = 'object'
          then (us.data ->> 'lorefy.user.library.v2')::jsonb
        else '{}'::jsonb
      end as library_entries,
      case
        when jsonb_typeof((us.data ->> 'lorefy.user.progress.v2')::jsonb) = 'object'
          then (us.data ->> 'lorefy.user.progress.v2')::jsonb
        else '{}'::jsonb
      end as progress_entries
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
      )
  ),
  reading_snapshot as (
    select
      snapshot.*,
      coalesce((
        select sum(
          case
            when jsonb_typeof(entry.value) = 'number'
              then greatest(0, (entry.value #>> '{}')::numeric)
            when jsonb_typeof(entry.value) = 'object'
              then greatest(
                0,
                coalesce(
                  nullif(entry.value ->> 'chapter', '')::numeric,
                  nullif(entry.value ->> 'ch', '')::numeric,
                  0
                )
              )
            else 0
          end
        )
        from jsonb_each(snapshot.progress_entries) entry
      ), 0)::bigint as total_chapters
    from profile_snapshot snapshot
  )
  select
    snapshot.id,
    snapshot.username,
    snapshot.name,
    snapshot.bio,
    snapshot.avatar,
    snapshot.banner,
    snapshot.genres,
    snapshot.social_links,
    (select count(*) from public.profile_follows f where f.following_id = snapshot.id),
    (select count(*) from public.profile_follows f where f.follower_id = snapshot.id),
    exists (
      select 1
      from public.profile_follows f
      where f.follower_id = auth.uid()
        and f.following_id = snapshot.id
    ),
    snapshot.favorite_work_ids,
    snapshot.favorite_character_ids,
    (
      select count(*)
      from jsonb_each_text(snapshot.library_entries) entry
      where entry.value in ('تم القراءة', 'تمت القراءة', 'مكتملة', 'completed', 'done', 'finished')
    ),
    snapshot.total_chapters,
    round(snapshot.total_chapters::numeric / 5)::bigint,
    snapshot.library_entries
  from reading_snapshot snapshot;
$$;

revoke all on function public.get_public_profile_social(uuid) from public, anon;
grant execute on function public.get_public_profile_social(uuid) to authenticated;
