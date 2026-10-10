-- Restore review media integrity checks after the rate-limit serialization update.
create or replace function public.publish_review(
  review_id uuid, work_ref text, review_rating numeric, review_body text,
  review_recommend boolean, review_spoiler boolean, image_paths text[], public_visible boolean default true
)
returns public.reviews
language plpgsql security definer
set search_path = public, storage, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  row_out public.reviews;
  safe_paths text[] := coalesce(image_paths, '{}'::text[]);
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  perform private.lock_actor_action('review');
  if (select count(*) from public.reviews where user_id = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'review_rate_limit' using errcode = 'P0001';
  end if;
  if cardinality(safe_paths) > 10
     or cardinality(safe_paths) <> (select count(distinct p) from unnest(safe_paths) p) then
    raise exception 'invalid_review_media_count' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(safe_paths) p
    where p !~ ('^' || uid::text || '/' || review_id::text || '/[A-Za-z0-9_-]+[.](jpg|png|webp)$')
  ) then
    raise exception 'invalid_review_media_path' using errcode = '22023';
  end if;
  if (
    select count(*) from storage.objects
    where bucket_id = 'review-media' and name = any(safe_paths)
  ) <> cardinality(safe_paths) then
    raise exception 'review_media_not_found' using errcode = '22023';
  end if;
  insert into public.reviews (id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public)
  values (
    review_id, uid, trim(work_ref), review_rating, left(coalesce(review_body,''),5000),
    review_recommend, coalesce(review_spoiler,false), safe_paths, coalesce(public_visible,true)
  )
  returning * into row_out;
  return row_out;
end;
$$;

revoke all on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) from public, anon;
grant execute on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) to authenticated;
