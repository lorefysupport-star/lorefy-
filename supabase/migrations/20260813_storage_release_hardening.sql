-- Prevent stale JWTs from creating orphan media and bind review rows to real uploads.

create or replace function public.is_active_auth_user()
returns boolean
language sql stable security definer
set search_path = pg_catalog, auth
as $$
  select auth.uid() is not null
    and exists (select 1 from auth.users where id = auth.uid());
$$;
revoke all on function public.is_active_auth_user() from public, anon;
grant execute on function public.is_active_auth_user() to authenticated;

drop policy if exists "profile media owner write" on storage.objects;
create policy "profile media owner write" on storage.objects for insert to authenticated
with check (
  public.is_active_auth_user()
  and bucket_id = 'profile-media'
  and name ~ ('^' || (select auth.uid())::text || '/(avatar|banner)\.(jpg|png|webp)$')
);

drop policy if exists "profile media owner update" on storage.objects;
create policy "profile media owner update" on storage.objects for update to authenticated
using (
  public.is_active_auth_user() and bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  public.is_active_auth_user() and bucket_id = 'profile-media'
  and name ~ ('^' || (select auth.uid())::text || '/(avatar|banner)\.(jpg|png|webp)$')
);

drop policy if exists "review media owner write" on storage.objects;
create policy "review media owner write" on storage.objects for insert to authenticated
with check (
  public.is_active_auth_user()
  and bucket_id = 'review-media'
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|png|webp)$')
);

drop policy if exists "review media owner update" on storage.objects;
create policy "review media owner update" on storage.objects for update to authenticated
using (
  public.is_active_auth_user() and bucket_id = 'review-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  public.is_active_auth_user()
  and bucket_id = 'review-media'
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f-]+\.(jpg|png|webp)$')
);

drop policy if exists "custom covers owner insert" on storage.objects;
create policy "custom covers owner insert" on storage.objects for insert to authenticated
with check (
  public.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "custom covers owner update" on storage.objects;
create policy "custom covers owner update" on storage.objects for update to authenticated
using (
  public.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  public.is_active_auth_user() and bucket_id = 'custom-covers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "reviews insert own" on public.reviews;
drop policy if exists "review comments insert own" on public.review_comments;
drop policy if exists "review reactions insert own" on public.review_reactions;
drop policy if exists "reports insert own" on public.reports;

create or replace function public.publish_review(
  review_id uuid, work_ref text, review_rating numeric, review_body text,
  review_recommend boolean, review_spoiler boolean, image_paths text[], public_visible boolean default true
)
returns public.reviews
language plpgsql security definer
set search_path = public, storage, pg_temp
as $$
declare
  uid uuid := auth.uid();
  row_out public.reviews;
  safe_paths text[] := coalesce(image_paths, '{}'::text[]);
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if cardinality(safe_paths) > 10 or cardinality(safe_paths) <> (select count(distinct p) from unnest(safe_paths) p) then
    raise exception 'invalid_review_media_count' using errcode = '22023';
  end if;
  if exists (select 1 from unnest(safe_paths) p where p !~ ('^' || uid::text || '/' || review_id::text || '/[0-9a-f-]+\.(jpg|png|webp)$')) then
    raise exception 'invalid_review_media_path' using errcode = '22023';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'review-media' and name = any(safe_paths)) <> cardinality(safe_paths) then
    raise exception 'review_media_not_found' using errcode = '22023';
  end if;
  if (select count(*) from public.reviews where user_id = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'review_rate_limit' using errcode = 'P0001';
  end if;
  insert into public.reviews (id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public)
  values (review_id,uid,trim(work_ref),review_rating,left(coalesce(review_body,''),5000),review_recommend,coalesce(review_spoiler,false),safe_paths,coalesce(public_visible,true))
  returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) from public, anon;
grant execute on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) to authenticated;
