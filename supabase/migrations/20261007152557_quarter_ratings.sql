set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Widen precision without changing any existing rating or its owner.
alter table public.reviews alter column rating type numeric(3,2) using rating::numeric(3,2);
alter table public.chapter_reviews alter column rating type numeric(3,2) using rating::numeric(3,2);
alter table public.chapter_reviews add constraint chapter_reviews_rating_quarter_step check (rating * 4 = trunc(rating * 4));

-- Keep one PostgREST signature; integer clients can still send whole scores.
drop function public.publish_chapter_review(text,integer,integer,text,boolean);
create function public.publish_chapter_review(work_ref text, chapter_ref integer, score numeric, comment_body text, has_spoiler boolean default false)
returns public.chapter_reviews language plpgsql security definer
set search_path=public,private,pg_temp as $$
declare result public.chapter_reviews;
begin
  if not private.is_active_auth_user() then raise exception 'invalid_session' using errcode='42501'; end if;
  if score is null or score < 0 or score > 5 or score * 4 <> trunc(score * 4) then
    raise exception 'invalid_rating' using errcode='22023';
  end if;
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
revoke all on function public.publish_chapter_review(text,integer,numeric,text,boolean) from public,anon;
grant execute on function public.publish_chapter_review(text,integer,numeric,text,boolean) to authenticated;
notify pgrst, 'reload schema';
