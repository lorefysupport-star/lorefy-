-- Server-resolved mentions. Existing interaction receipts and push hook remain owners.
begin;
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('comment','reaction','follow','chapter','system','mention'));

create or replace function private.notify_text_mentions()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  row_data jsonb:=to_jsonb(new); old_body text:=''; text_body text:=coalesce(row_data->>'body','');
  actor uuid:=new.user_id; recipient uuid; source_id uuid:=new.id; root_id uuid;
  work_ref text; review_id uuid; context_owner uuid; event_name text; destination text; event_data jsonb;
  actor_name text;
begin
  if coalesce((row_data->>'is_deleted')::boolean,false) then return new; end if;
  if not exists(select 1 from public.profiles where id=actor and not is_private) then return new; end if;
  if tg_op='UPDATE' then old_body:=coalesce(to_jsonb(old)->>'body',''); end if;
  if tg_table_name='reviews' then
    if not new.is_public then return new; end if;
    if tg_op='UPDATE' and not old.is_public then old_body:=''; end if;
    review_id:=new.id;work_ref:=new.work_id;context_owner:=actor;event_name:='review_mention';
  elsif tg_table_name='review_comments' then
    select r.id,r.work_id,r.user_id into review_id,work_ref,context_owner from public.reviews r
      join public.profiles p on p.id=r.user_id where r.id=new.review_id and r.is_public and not p.is_private;
    if review_id is null then return new; end if;
    event_name:='comment_mention';
  elsif tg_table_name='community_posts' then
    root_id:=coalesce(new.parent_id,new.id);
    select user_id into context_owner from public.community_posts where id=root_id;
    if new.parent_id is not null and not exists(
      select 1 from public.community_posts c join public.profiles p on p.id=c.user_id
      where c.id=root_id and not c.is_deleted and not p.is_private
    ) then return new; end if;
    event_name:='post_mention';
  else return new; end if;
  destination:=case when review_id is not null then '/review/'||review_id::text else '/community' end;
  event_data:=jsonb_strip_nulls(jsonb_build_object('event',event_name,'reviewId',review_id,'workId',work_ref,
    'postId',root_id,'replyId',case when tg_table_name='community_posts' and new.id<>root_id then new.id end,
    'commentId',case when tg_table_name='review_comments' then new.id end,'mentionSourceId',source_id));
  select coalesce(nullif(name,''),username,'قارئ Lorefy') into actor_name from public.profiles where id=actor;
  -- Only canonical usernames, never arbitrary recipient IDs supplied by a client.
  for recipient in
    select distinct p.id from regexp_matches(text_body,'(^|[^[:alnum:]_@])@([A-Za-z0-9_]{3,24})(?![A-Za-z0-9_])','g') m
      join public.profiles p on p.username=lower(m[2])
    where p.id<>actor and not exists(
      select 1 from regexp_matches(old_body,'(^|[^[:alnum:]_@])@([A-Za-z0-9_]{3,24})(?![A-Za-z0-9_])','g') previous
      where lower(previous[2])=p.username
    ) order by p.id limit 20
  loop
    if exists(select 1 from public.profile_blocks b where
      (b.blocker_id=context_owner and b.blocked_id=recipient) or
      (b.blocker_id=recipient and b.blocked_id=context_owner)) then continue; end if;
    -- A direct reply/comment and a mention in the same text are one receipt.
    if exists(select 1 from public.notifications n where n.user_id=recipient and n.actor_id=actor and n.kind='comment'
      and ((tg_table_name='review_comments' and n.data->>'commentId'=source_id::text)
        or (tg_table_name='community_posts' and n.data->>'replyId'=source_id::text))) then continue; end if;
    perform private.enqueue_notification(recipient,actor,'mention','أشار إليك',
      coalesce(actor_name,'قارئ Lorefy')||' أشار إليك في '||case when tg_table_name='reviews' then 'مراجعته' when tg_table_name='review_comments' then 'تعليق' else 'منشور' end,
      destination,event_data,'mention:'||tg_table_name||':'||source_id::text||':'||recipient::text);
  end loop;
  return new;
end;
$$;
revoke all on function private.notify_text_mentions() from public,anon,authenticated;
drop trigger if exists zz_notify_mentions on public.community_posts;
create trigger zz_notify_mentions after insert or update of body on public.community_posts for each row execute function private.notify_text_mentions();
drop trigger if exists zz_notify_mentions on public.reviews;
create trigger zz_notify_mentions after insert or update of body,is_public on public.reviews for each row execute function private.notify_text_mentions();
drop trigger if exists zz_notify_mentions on public.review_comments;
create trigger zz_notify_mentions after insert or update of body on public.review_comments for each row execute function private.notify_text_mentions();
create index if not exists notifications_user_cursor_idx on public.notifications(user_id,created_at desc,id desc);
commit;
