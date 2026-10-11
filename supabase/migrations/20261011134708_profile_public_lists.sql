-- Narrow public projection of ranked lists. No direct access to user_state.
create or replace function public.get_public_profile_lists(profile_ref uuid)
returns jsonb language sql stable security definer
set search_path = public, private, pg_temp as $$
  with snapshot as (
    select private.reader_state_json(us.data->>'lorefy.user.profileLists.v1','[]') lists
    from public.profiles p left join public.user_state us on us.user_id=p.id
    where auth.uid() is not null and p.id=profile_ref
      and (p.id=auth.uid() or (not p.is_private
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)))
  ), folders as (
    select folder, position from snapshot,
      jsonb_array_elements(case when jsonb_typeof(lists)='array' then lists else '[]'::jsonb end)
        with ordinality entry(folder,position)
    where position<=40 and jsonb_typeof(folder)='object'
      and folder->'isPublic'='true'::jsonb
      and length(btrim(folder->>'id'))>0 and length(btrim(folder->>'name'))>0
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',left(folder->>'id',100), 'name',left(folder->>'name',100),
    'description',left(coalesce(folder->>'description',''),500),
    'kind',case when folder->>'kind'='characters' then 'characters' else 'works' end,
    'isPublic',true, 'updatedAt',left(coalesce(folder->>'updatedAt',''),40),
    'items',(
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',left(item->>'id',120), 'workId',left(coalesce(item->>'workId',''),120),
        'name',left(coalesce(item->>'name',''),160),
        'image',case when item->>'image' ~* '^https?://' then left(item->>'image',2000) else '' end
      ) order by rank),'[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(folder->'items')='array' then folder->'items' else '[]'::jsonb end)
        with ordinality ranked(item,rank)
      where rank<=50 and jsonb_typeof(item)='object' and length(btrim(item->>'id'))>0
    )
  ) order by position),'[]'::jsonb) from folders;
$$;
revoke all on function public.get_public_profile_lists(uuid) from public, anon;
grant execute on function public.get_public_profile_lists(uuid) to authenticated;
