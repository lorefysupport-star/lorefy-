-- Keep the public profile page aligned with the owner's full profile fields.

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
    coalesce(p.social_links, '{}'::jsonb),
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
