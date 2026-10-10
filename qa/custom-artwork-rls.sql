-- Transactional fixtures only: every user-state and privacy edit is rolled back.
begin;
do $$
declare owner_id uuid; viewer_id uuid; object_name text;
begin
  select p.id, v.id into owner_id, viewer_id
  from public.profiles p cross join public.profiles v
  where p.id <> v.id and not exists (
    select 1 from public.profile_blocks b
    where (b.blocker_id=p.id and b.blocked_id=v.id) or (b.blocker_id=v.id and b.blocked_id=p.id)
  ) limit 1;
  if owner_id is null then raise exception 'No suitable fixture accounts'; end if;
  object_name := owner_id::text || '/covers/qa-only.jpg';
  update public.profiles set is_private=false where id=owner_id;
  insert into public.user_state(user_id,data) values(owner_id,'{}') on conflict(user_id) do nothing;
  update public.user_state set data=data || jsonb_build_object(
    'lorefy.user.customCovers.v2', jsonb_build_object('qa-work','lorefy-artwork:'||object_name)::text,
    'lorefy.user.favorites.v2','["qa-work"]',
    'lorefy.characterCustomImages.v1', jsonb_build_object('qa-hero','lorefy-artwork:'||owner_id::text||'/characters/qa-only.jpg')::text,
    'lorefy.user.profileTopCharacters.v1','[{"character":{"id":"qa-hero"}}]'
  ) where user_id=owner_id;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  if not private.can_read_custom_artwork(object_name) then raise exception 'Owner denied'; end if;
  perform set_config('request.jwt.claim.sub',viewer_id::text,true);
  if not private.can_read_custom_artwork(object_name) then raise exception 'Visible cover denied'; end if;
  if not private.can_read_custom_artwork(owner_id::text||'/characters/qa-only.jpg') then raise exception 'Visible portrait denied'; end if;
  if private.can_read_custom_artwork(owner_id::text||'/covers/unpublished.jpg') then raise exception 'Unpublished upload exposed'; end if;
  if private.can_read_custom_artwork('not-a-uuid/covers/image.jpg') then raise exception 'Malformed owner accepted'; end if;
  update public.profiles set is_private=true where id=owner_id;
  if private.can_read_custom_artwork(object_name) then raise exception 'Private artwork exposed'; end if;
  update public.profiles set is_private=false where id=owner_id;
  insert into public.profile_blocks(blocker_id,blocked_id) values(owner_id,viewer_id);
  if private.can_read_custom_artwork(object_name) then raise exception 'Blocked viewer accepted'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  if private.can_read_custom_artwork(object_name) then raise exception 'Anonymous viewer accepted'; end if;
end;
$$;
rollback;
select 'owner, visitor, portrait, unpublished, malformed, private, blocked, anonymous: passed; fixtures rolled back' as artwork_access_checks;
