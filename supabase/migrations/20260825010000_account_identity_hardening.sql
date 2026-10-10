-- Lorefy release 13 account identity hardening.
-- Usernames are claimed by a single server-side transaction. The database,
-- rather than a client-side availability check, remains the source of truth.

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

create or replace function public.username_is_available(requested_username text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  clean_username text := lower(trim(regexp_replace(coalesce(requested_username, ''), '^@', '')));
begin
  if not private.is_active_auth_user() then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if clean_username !~ '^[a-z0-9_]{3,24}$' then
    return false;
  end if;
  return not exists (
    select 1
    from public.profiles p
    where lower(p.username) = clean_username
      and p.id <> uid
  );
end;
$$;

create or replace function public.save_my_profile(
  profile_name text,
  requested_username text,
  profile_bio text,
  profile_avatar text,
  profile_banner text,
  profile_genres jsonb,
  profile_social_links jsonb,
  profile_is_private boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  clean_username text;
  current_username text;
  clean_name text := trim(coalesce(profile_name, ''));
  clean_bio text := trim(coalesce(profile_bio, ''));
  clean_avatar text := nullif(trim(coalesce(profile_avatar, '')), '');
  clean_banner text := nullif(trim(coalesce(profile_banner, '')), '');
  clean_genres jsonb := coalesce(profile_genres, '[]'::jsonb);
  clean_social_links jsonb := coalesce(profile_social_links, '{}'::jsonb);
  row_out public.profiles;
begin
  if not private.is_active_auth_user() then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if char_length(clean_name) > 80 or char_length(clean_bio) > 500 then
    raise exception 'invalid_profile' using errcode = '22023';
  end if;
  if jsonb_typeof(clean_genres) <> 'array'
     or jsonb_typeof(clean_social_links) <> 'object'
     or pg_column_size(clean_social_links) > 8192 then
    raise exception 'invalid_profile' using errcode = '22023';
  end if;
  if clean_avatar is not null and clean_avatar !~ ('^' || uid::text || '/avatar[.](jpg|png|webp)$') then
    raise exception 'invalid_profile_media' using errcode = '22023';
  end if;
  if clean_banner is not null and clean_banner !~ ('^' || uid::text || '/banner[.](jpg|png|webp)$') then
    raise exception 'invalid_profile_media' using errcode = '22023';
  end if;

  select p.username into current_username
  from public.profiles p
  where p.id = uid
  for update;

  if requested_username is null then
    clean_username := current_username;
  else
    clean_username := lower(trim(regexp_replace(requested_username, '^@', '')));
    if clean_username = '' then
      clean_username := null;
    elsif clean_username !~ '^[a-z0-9_]{3,24}$' then
      raise exception 'invalid_username' using errcode = '22023';
    end if;
  end if;

  begin
    insert into public.profiles as p (
      id, username, name, bio, avatar, banner, genres, social_links, is_private, updated_at
    ) values (
      uid, clean_username, clean_name, clean_bio, clean_avatar, clean_banner,
      clean_genres, clean_social_links, coalesce(profile_is_private, false), timezone('utc', now())
    )
    on conflict (id) do update
    set username = excluded.username,
        name = excluded.name,
        bio = excluded.bio,
        avatar = excluded.avatar,
        banner = excluded.banner,
        genres = excluded.genres,
        social_links = excluded.social_links,
        is_private = excluded.is_private,
        updated_at = excluded.updated_at
    returning p.* into row_out;
  exception when unique_violation then
    raise exception 'username_taken' using errcode = '23505';
  end;
  return row_out;
end;
$$;

revoke all on function public.username_is_available(text) from public, anon;
grant execute on function public.username_is_available(text) to authenticated;
revoke all on function public.save_my_profile(text, text, text, text, text, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.save_my_profile(text, text, text, text, text, jsonb, jsonb, boolean) to authenticated;

-- Profile mutations must pass through save_my_profile so validation and the
-- unique username index are always reached, even by a modified client.
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
