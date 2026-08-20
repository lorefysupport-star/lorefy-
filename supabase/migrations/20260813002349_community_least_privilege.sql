-- Route community mutations through validated functions; retain RLS as defense in depth.

revoke all on public.reviews, public.review_comments, public.review_reactions, public.reports from anon;
revoke all on public.reviews, public.review_comments, public.review_reactions, public.reports from authenticated;
grant select on public.reviews, public.review_comments, public.review_reactions to anon, authenticated;
grant delete, update on public.reviews to authenticated;
grant delete, update on public.review_comments to authenticated;
grant delete on public.review_reactions to authenticated;
grant select on public.reports to authenticated;

create or replace function public.publish_review_comment(review_ref uuid, comment_body text)
returns public.review_comments
language plpgsql security definer set search_path = public, pg_temp
as $$
declare uid uuid := auth.uid(); row_out public.review_comments;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if char_length(trim(coalesce(comment_body,''))) not between 1 and 2000 then raise exception 'invalid_comment' using errcode='22023'; end if;
  if not exists(select 1 from public.reviews r where r.id=review_ref and (r.is_public or r.user_id=uid)) then raise exception 'review_not_found' using errcode='P0002'; end if;
  if (select count(*) from public.review_comments where user_id=uid and created_at>now()-interval '1 hour') >= 60 then raise exception 'comment_rate_limit' using errcode='P0001'; end if;
  insert into public.review_comments(review_id,user_id,body) values(review_ref,uid,trim(comment_body)) returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_review_comment(uuid,text) from public,anon;
grant execute on function public.publish_review_comment(uuid,text) to authenticated;

create or replace function public.set_review_reaction(review_ref uuid, reaction_kind text, reaction_active boolean default true)
returns boolean language plpgsql security definer set search_path=public,pg_temp
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if reaction_kind not in ('like','dislike','heart') then raise exception 'invalid_reaction' using errcode='22023'; end if;
  if not exists(select 1 from public.reviews r where r.id=review_ref and (r.is_public or r.user_id=uid)) then raise exception 'review_not_found' using errcode='P0002'; end if;
  if reaction_active then
    insert into public.review_reactions(review_id,user_id,kind) values(review_ref,uid,reaction_kind) on conflict do nothing;
  else
    delete from public.review_reactions where review_id=review_ref and user_id=uid and kind=reaction_kind;
  end if;
  return reaction_active;
end;
$$;
revoke all on function public.set_review_reaction(uuid,text,boolean) from public,anon;
grant execute on function public.set_review_reaction(uuid,text,boolean) to authenticated;

alter table public.profiles validate constraint profiles_username_shape;
alter table public.profiles validate constraint profiles_name_length;
alter table public.profiles validate constraint profiles_bio_length;
alter table public.profiles validate constraint profiles_social_links_size;
alter table public.user_state validate constraint user_state_payload_size;
alter table public.reviews validate constraint reviews_work_id_length;
alter table public.reports validate constraint reports_target_id_length;
alter table public.reports validate constraint reports_reason_check;
alter table public.reports validate constraint reports_details_length;

