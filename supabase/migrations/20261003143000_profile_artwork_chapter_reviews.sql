-- Public artwork is a projection of visible profile shelves, never raw reader state.
create or replace function private.reader_state_json(value text, fallback jsonb)
returns jsonb language plpgsql immutable set search_path = pg_catalog as $$
begin return coalesce(value::jsonb, fallback);
exception when invalid_text_representation then return fallback;
end;
$$;
revoke all on function private.reader_state_json(text,jsonb) from public, anon, authenticated;

create or replace function public.get_public_profile_artwork(profile_ref uuid)
returns jsonb language sql stable security definer
set search_path = public, private, pg_temp as $$
  with snapshot as (
    select private.reader_state_json(us.data->>'lorefy.user.customCovers.v2','{}') covers,
      private.reader_state_json(us.data->>'lorefy.characterCustomImages.v1','{}') portraits,
      private.reader_state_json(us.data->>'lorefy.user.favorites.v2','[]') favorites,
      private.reader_state_json(us.data->>'lorefy.user.library.v2','{}') library,
      private.reader_state_json(us.data->>'lorefy.user.profileTopCharacters.v1','[]') characters
    from public.profiles p left join public.user_state us on us.user_id=p.id
    where auth.uid() is not null and p.id=profile_ref
      and (p.id=auth.uid() or (not p.is_private
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)))
  )
  select jsonb_build_object(
    'custom_work_covers', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.covers)='object' then s.covers else '{}' end) c
      where jsonb_typeof(c.value)='string' and
        ((case when jsonb_typeof(s.favorites)='array' then s.favorites else '[]' end) ? c.key
         or (case when jsonb_typeof(s.library)='object' then s.library else '{}' end) ? c.key)), '{}'),
    'custom_character_images', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.portraits)='object' then s.portraits else '{}' end) c
      where jsonb_typeof(c.value)='string' and exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(s.characters)='array' then s.characters else '[]' end) r
        where c.key=coalesce(r->'character'->>'id',r->'character'->>'key',r->>'id',r->>'key',r->>'characterKey',
          regexp_replace(regexp_replace(lower(trim(coalesce(r->'character'->>'latin',r->'character'->>'name',r->>'latin',r->>'name',''))),'\s+','-','g'),'[^a-z0-9_ء-ي-]','','g')))), '{}'))
  from snapshot s;
$$;
revoke all on function public.get_public_profile_artwork(uuid) from public, anon;
grant execute on function public.get_public_profile_artwork(uuid) to authenticated;

create table public.chapter_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_id text not null check(length(work_id) between 1 and 200),
  chapter integer not null check(chapter between 1 and 100000),
  rating smallint not null default 0 check(rating between 0 and 5),
  body text not null default '' check(length(body)<=1000),
  spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, work_id, chapter),
  check(rating>0 or length(trim(body))>0)
);
create index chapter_reviews_work_chapter_idx on public.chapter_reviews(work_id,chapter,updated_at desc,id desc);
alter table public.chapter_reviews enable row level security;
revoke all on public.chapter_reviews from public, anon, authenticated;
grant select, delete on public.chapter_reviews to authenticated;
create policy "Visible chapter reviews" on public.chapter_reviews for select to authenticated
using(user_id=auth.uid() or (not private.author_has_blocked_viewer(user_id)
  and not private.reader_has_blocked_author(user_id)
  and exists(select 1 from public.profiles p where p.id=user_id and not p.is_private)));
create policy "Delete own chapter review" on public.chapter_reviews for delete to authenticated
using(user_id=auth.uid());
create trigger moderate_chapter_reviews_text before insert or update of body on public.chapter_reviews
for each row execute function public.moderate_community_text();

create or replace function public.publish_chapter_review(work_ref text, chapter_ref integer, score integer, comment_body text, has_spoiler boolean default false)
returns public.chapter_reviews language plpgsql security definer
set search_path=public,private,pg_temp as $$
declare result public.chapter_reviews;
begin
  if not private.is_active_auth_user() then raise exception 'invalid_session' using errcode='42501'; end if;
  perform private.lock_actor_action('chapter_review');
  if (select count(*) from public.chapter_reviews where user_id=auth.uid() and updated_at>now()-interval '1 minute')>=12 then
    raise exception 'chapter_review_rate_limit' using errcode='P0001';
  end if;
  insert into public.chapter_reviews(user_id,work_id,chapter,rating,body,spoiler)
  values(auth.uid(),trim(work_ref),chapter_ref,score,trim(coalesce(comment_body,'')),coalesce(has_spoiler,false))
  on conflict(user_id,work_id,chapter) do update set rating=excluded.rating,body=excluded.body,spoiler=excluded.spoiler,updated_at=now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.publish_chapter_review(text,integer,integer,text,boolean) from public,anon;
grant execute on function public.publish_chapter_review(text,integer,integer,text,boolean) to authenticated;
