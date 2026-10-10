-- Custom artwork stays private. Readers may sign only images the owner exposes.
create or replace function private.can_read_custom_artwork(object_name text)
returns boolean language plpgsql stable security definer
set search_path = public, private, pg_temp as $$
declare
  owner_id uuid;
  artwork jsonb;
begin
  if auth.uid() is null then return false; end if;
  begin
    owner_id := split_part(object_name, '/', 1)::uuid;
  exception when invalid_text_representation then return false;
  end;
  if owner_id = auth.uid() then return true; end if;
  artwork := public.get_public_profile_artwork(owner_id);
  return exists (
    select 1 from jsonb_each_text(coalesce(artwork->'custom_work_covers', '{}'::jsonb)) image
    where image.value = 'lorefy-artwork:' || object_name
  ) or exists (
    select 1 from jsonb_each_text(coalesce(artwork->'custom_character_images', '{}'::jsonb)) image
    where image.value = 'lorefy-artwork:' || object_name
  ) or exists (
    select 1 from public.community_posts post
    join public.profiles p on p.id = post.user_id
    where post.user_id = owner_id and not post.is_deleted and not p.is_private
      and not private.author_has_blocked_viewer(p.id)
      and not private.reader_has_blocked_author(p.id)
      and exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(post.attachment->'items') = 'array'
          then post.attachment->'items' else '[]'::jsonb end) item
        where item->>'image' = 'lorefy-artwork:' || object_name
      )
  );
end;
$$;
revoke all on function private.can_read_custom_artwork(text) from public, anon;
grant execute on function private.can_read_custom_artwork(text) to authenticated;
create policy "custom artwork visible read" on storage.objects
for select to authenticated
using (bucket_id = 'custom-covers' and private.can_read_custom_artwork(name));
