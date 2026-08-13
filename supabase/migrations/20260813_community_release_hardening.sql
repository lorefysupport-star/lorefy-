-- Lorefy community release hardening.
-- Keeps community content server-owned, bounded, and attributable to auth.uid().

alter table public.profiles
  add constraint profiles_username_shape
  check (username is null or username ~ '^[a-z0-9_]{3,24}$') not valid,
  add constraint profiles_name_length
  check (char_length(coalesce(name, '')) <= 80) not valid,
  add constraint profiles_bio_length
  check (char_length(coalesce(bio, '')) <= 500) not valid,
  add constraint profiles_social_links_size
  check (jsonb_typeof(social_links) = 'object' and pg_column_size(social_links) <= 8192) not valid;

alter table public.user_state
  add constraint user_state_payload_size
  check (pg_column_size(data) <= 6291456) not valid;

alter table public.reviews
  add constraint reviews_work_id_length
  check (char_length(work_id) between 1 and 200) not valid;

alter table public.review_reactions drop constraint if exists review_reactions_kind_check;
alter table public.review_reactions
  add constraint review_reactions_kind_check
  check (kind in ('like', 'dislike', 'heart'));

alter table public.reports
  add constraint reports_target_id_length
  check (char_length(target_id) between 1 and 200) not valid,
  add constraint reports_reason_check
  check (reason in ('spam', 'abuse', 'harassment', 'spoiler', 'misinformation', 'copyright')) not valid,
  add constraint reports_details_length
  check (char_length(coalesce(details, '')) <= 800) not valid;

create index if not exists reviews_public_created_idx
  on public.reviews (created_at desc) where is_public = true;
create index if not exists reviews_work_created_idx
  on public.reviews (work_id, created_at desc) where is_public = true;
create index if not exists review_comments_review_created_idx
  on public.review_comments (review_id, created_at);
create index if not exists reports_reporter_created_idx
  on public.reports (reporter_id, created_at desc);

create or replace function public.search_public_profiles(search_text text, result_limit integer default 20)
returns table (id uuid, username text, name text, bio text, avatar text, genres jsonb)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  query_text text := lower(trim(coalesce(search_text, '')));
  escaped_pattern text;
  safe_limit integer := least(greatest(coalesce(result_limit, 20), 1), 20);
begin
  if auth.uid() is null or char_length(query_text) < 2 or char_length(query_text) > 64 then return; end if;
  escaped_pattern := '%' || replace(replace(replace(query_text, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';
  return query
    select p.id, p.username, coalesce(p.name, ''), coalesce(p.bio, ''), p.avatar, to_jsonb(p.genres)
    from public.profiles p
    where p.is_private = false and p.username is not null and p.username <> ''
      and (lower(p.username) like escaped_pattern escape E'\\' or lower(coalesce(p.name, '')) like escaped_pattern escape E'\\')
    order by case when lower(p.username) = query_text then 0 else 1 end,
      case when lower(p.username) like query_text || '%' then 0 else 1 end,
      p.updated_at desc
    limit safe_limit;
end;
$$;
revoke all on function public.search_public_profiles(text, integer) from public, anon;
grant execute on function public.search_public_profiles(text, integer) to authenticated;

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
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if (select count(*) from public.reviews where user_id = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'review_rate_limit' using errcode = 'P0001';
  end if;
  if image_paths is null then image_paths := '{}'::text[]; end if;
  if exists (select 1 from unnest(image_paths) p where p !~ ('^' || uid::text || '/' || review_id::text || '/[0-9a-f-]+\\.(jpg|png|webp)$')) then
    raise exception 'invalid_review_media_path' using errcode = '22023';
  end if;
  insert into public.reviews (id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public)
  values (review_id,uid,trim(work_ref),review_rating,left(coalesce(review_body,''),5000),review_recommend,coalesce(review_spoiler,false),image_paths,coalesce(public_visible,true))
  returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) from public, anon;
grant execute on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) to authenticated;
revoke insert on public.reviews from authenticated;

create or replace function public.submit_report(target_kind text, target_ref text, report_reason text, report_details text default null)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare uid uuid := auth.uid(); new_id uuid;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if target_kind not in ('profile','review','comment','work') or report_reason not in ('spam','abuse','harassment','spoiler','misinformation','copyright') then
    raise exception 'invalid_report' using errcode = '22023';
  end if;
  if (select count(*) from public.reports where reporter_id=uid and created_at > now()-interval '1 hour') >= 20 then
    raise exception 'report_rate_limit' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.reports where reporter_id=uid and target_type=target_kind and target_id=target_ref and reason=report_reason and created_at > now()-interval '1 hour') then
    raise exception 'duplicate_report' using errcode = '23505';
  end if;
  insert into public.reports(reporter_id,target_type,target_id,reason,details)
  values(uid,target_kind,left(trim(target_ref),200),report_reason,left(coalesce(report_details,''),800)) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_report(text,text,text,text) from public, anon;
grant execute on function public.submit_report(text,text,text,text) to authenticated;
revoke insert on public.reports from authenticated;

drop policy if exists "profile media owner write" on storage.objects;
create policy "profile media owner write" on storage.objects for insert to authenticated
with check (bucket_id='profile-media' and name ~ ('^' || (select auth.uid())::text || '/(avatar|banner)\\.(jpg|png|webp)$'));

