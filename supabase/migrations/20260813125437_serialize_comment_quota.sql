-- Serialize comment quota checks per actor to prevent concurrent bypasses.
create or replace function public.publish_review_comment(review_ref uuid, comment_body text)
returns public.review_comments
language plpgsql security definer set search_path = public, private, pg_temp
as $$
declare uid uuid := auth.uid(); row_out public.review_comments;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if char_length(trim(coalesce(comment_body,''))) not between 1 and 2000 then raise exception 'invalid_comment' using errcode='22023'; end if;
  if not private.can_interact_with_review(review_ref) then raise exception 'review_not_found' using errcode='P0002'; end if;
  perform private.lock_actor_action('comment');
  if (select count(*) from public.review_comments where user_id=uid and created_at>now()-interval '1 hour') >= 60 then
    raise exception 'comment_rate_limit' using errcode='P0001';
  end if;
  insert into public.review_comments(review_id,user_id,body)
  values(review_ref,uid,trim(comment_body)) returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_review_comment(uuid,text) from public,anon;
grant execute on function public.publish_review_comment(uuid,text) to authenticated;
