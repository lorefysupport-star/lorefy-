-- Allow one-level or deeper reply threads while keeping every reply inside its review.

alter table public.review_comments
  add column if not exists parent_id uuid references public.review_comments(id) on delete set null;

create index if not exists review_comments_parent_created_idx
  on public.review_comments (parent_id, created_at)
  where parent_id is not null and is_deleted = false;

drop function if exists public.publish_review_comment(uuid, text);

create or replace function public.publish_review_comment(
  review_ref uuid,
  comment_body text,
  parent_ref uuid default null
)
returns public.review_comments
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  row_out public.review_comments;
  parent_comment public.review_comments;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if char_length(trim(coalesce(comment_body, ''))) not between 1 and 2000 then
    raise exception 'invalid_comment' using errcode = '22023';
  end if;
  if not private.can_interact_with_review(review_ref) then
    raise exception 'review_not_found' using errcode = 'P0002';
  end if;
  if parent_ref is not null then
    select * into parent_comment
    from public.review_comments
    where id = parent_ref and not is_deleted;
    if not found or parent_comment.review_id <> review_ref then
      raise exception 'invalid_comment_parent' using errcode = '22023';
    end if;
  end if;

  perform private.lock_actor_action('comment');
  if (select count(*) from public.review_comments where user_id = uid and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'comment_rate_limit' using errcode = 'P0001';
  end if;

  insert into public.review_comments(review_id, user_id, parent_id, body)
  values(review_ref, uid, parent_ref, trim(comment_body))
  returning * into row_out;
  return row_out;
end;
$$;

revoke all on function public.publish_review_comment(uuid, text, uuid) from public, anon;
grant execute on function public.publish_review_comment(uuid, text, uuid) to authenticated;
