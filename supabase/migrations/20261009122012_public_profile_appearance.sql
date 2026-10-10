-- Public presentation only; account state and blocked/private profiles stay private.
create or replace function public.get_public_profile_appearance(profile_ref uuid)
returns jsonb language sql stable security definer
set search_path = public, private, pg_temp as $$
  with snapshot as (
    select trim(both '"' from us.data->>'lorefy.ui.theme.v1') theme,
      trim(both '"' from us.data->>'lorefy.library.view.v1') library_view,
      private.reader_state_json(us.data->>'lorefy.user.favoriteType.v1','""') favorite_type,
      private.reader_state_json(us.data->>'lorefy.user.bannerPos.v2','50') banner_position
    from public.profiles p left join public.user_state us on us.user_id=p.id
    where auth.uid() is not null and p.id=profile_ref
      and (p.id=auth.uid() or (not p.is_private
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)))
  )
  select jsonb_build_object(
    'theme',case when theme in ('dark','light','pink') or theme ~ '^custom-(light|dark)-[0-9a-fA-F]{6}$' then lower(theme) else 'dark' end,
    'library_view',case when library_view in ('spines','shelf') then library_view else 'grid' end,
    'favorite_type',case when favorite_type #>> '{}' in ('Manga','Manhwa','Manhua','Comics','Book','Novel','Light Novel','Web Novel') then favorite_type #>> '{}' else '' end,
    'banner_position',case when jsonb_typeof(banner_position)='number' then least(100,greatest(0,(banner_position #>> '{}')::numeric)) else 50 end
  ) from snapshot;
$$;
revoke all on function public.get_public_profile_appearance(uuid) from public, anon;
grant execute on function public.get_public_profile_appearance(uuid) to authenticated;

-- Batch search preserves the existing discovery privacy/block checks, without N+1 requests.
create or replace function public.search_public_readers(search_text text, result_limit integer default 20)
returns jsonb language sql stable security invoker
set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(to_jsonb(reader) || coalesce(public.get_public_profile_appearance(reader.id),'{}'::jsonb)), '[]'::jsonb)
  from public.search_public_profiles(search_text,result_limit) reader;
$$;
revoke all on function public.search_public_readers(text, integer) from public, anon;
grant execute on function public.search_public_readers(text, integer) to authenticated;
