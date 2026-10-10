-- Extend the existing owner artwork projection; never expose raw account state.
create or replace function public.get_public_profile_artwork(profile_ref uuid)
returns jsonb language sql stable security definer
set search_path = public, private, pg_temp as $$
  with snapshot as (
    select private.reader_state_json(us.data->>'lorefy.user.customCovers.v2','{}') covers,
      private.reader_state_json(us.data->>'lorefy.characterCustomImages.v1','{}') portraits,
      private.reader_state_json(us.data->>'lorefy.user.favorites.v2','[]') favorites,
      private.reader_state_json(us.data->>'lorefy.user.library.v2','{}') library,
      private.reader_state_json(us.data->>'lorefy.user.profileTopCharacters.v1','[]') characters,
      private.reader_state_json(us.data->>'lorefy.user.profileLayout.v1','"normal"') profile_layout,
      private.reader_state_json(us.data->>'lorefy.user.profileDecoration.v1','{}') decoration
    from public.profiles p left join public.user_state us on us.user_id=p.id
    where auth.uid() is not null and p.id=profile_ref
      and (p.id=auth.uid() or (not p.is_private
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)))
  )
  select jsonb_build_object(
    'profile_layout', case when s.profile_layout = '"immersive"'::jsonb then 'immersive' else 'normal' end,
    'profile_decoration', case when s.decoration->>'ownerId' = profile_ref::text then
      (select jsonb_object_agg(item.key,case when s.decoration->>item.key in ('observatory','blossom','manuscript','pfpvibes-maple-drift','pfpvibes-robins-perch','pfpvibes-mushroom-grove','pfpvibes-grasping-hands','pfpvibes-ghost-orbit','pfpvibes-watching-eyes','pfpvibes-prism-spin','pfpvibes-ripple-pulse','pfpvibes-neon-orbit','pfpvibes-pearl-bubbles','pfpvibes-scale-shimmer','pfpvibes-coral-crown','pfpvibes-block-party','pfpvibes-rocket-ride','pfpvibes-gumball-ring','pfpvibes-goal-rush','pfpvibes-stadium-lights','pfpvibes-champion-laurel','pfpvibes-peekaboo-pal','pfpvibes-bunny-hug','pfpvibes-kitty-crew','pfpvibes-moth-lantern','pfpvibes-rune-circle','pfpvibes-thorn-rose')
        then s.decoration->item.key else 'null'::jsonb end) from unnest(array['frame','page','effect']) item(key))
      else jsonb_build_object('frame',null,'page',null,'effect',null) end,
    'custom_work_covers', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.covers)='object' then s.covers else '{}' end) c
      where jsonb_typeof(c.value)='string' and
        ((case when jsonb_typeof(s.favorites)='array' then s.favorites else '[]' end) ? c.key
         or (case when jsonb_typeof(s.library)='object' then s.library else '{}' end) ? c.key)), '{}'),
    'custom_character_images', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.portraits)='object' then s.portraits else '{}' end) c
      where jsonb_typeof(c.value)='string' and exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(s.characters)='array' then s.characters else '[]' end) r
        where c.key in (r->'character'->>'id',r->'character'->>'key',r->>'id',r->>'key',r->>'characterKey',
          regexp_replace(regexp_replace(lower(trim(coalesce(r->'character'->>'latin',r->'character'->>'name',r->>'latin',r->>'name',''))),'\s+','-','g'),'[^a-z0-9_ء-ي-]','','g')))), '{}'))
  from snapshot s;
$$;
revoke all on function public.get_public_profile_artwork(uuid) from public, anon;
grant execute on function public.get_public_profile_artwork(uuid) to authenticated;
