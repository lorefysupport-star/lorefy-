-- Persistent in-app interaction receipts. No new public grants or push configuration.
begin;

create or replace function private.enqueue_notification(
  recipient_id uuid, actor_ref uuid, notification_kind text, notification_title text,
  notification_body text, destination_path text, payload jsonb, dedupe_key text
)
returns void language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare actor_name text; actor_username text;
begin
  if recipient_id is null or recipient_id = actor_ref then return; end if;
  if actor_ref is not null and exists (
    select 1 from public.profile_blocks b
    where (b.blocker_id=recipient_id and b.blocked_id=actor_ref)
       or (b.blocker_id=actor_ref and b.blocked_id=recipient_id)
  ) then return; end if;
  select left(coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy'),120),left(p.username,80)
  into actor_name,actor_username from public.profiles p where p.id=actor_ref;
  insert into public.notifications(user_id,actor_id,kind,title,body,target_path,data,event_key)
  values(recipient_id,actor_ref,notification_kind,left(notification_title,120),
    left(coalesce(notification_body,''),500),destination_path,
    coalesce(payload,'{}'::jsonb)||jsonb_strip_nulls(jsonb_build_object('actorName',actor_name,'actorUsername',actor_username)),
    left(dedupe_key,300))
  on conflict(event_key) do nothing;
end;
$$;
revoke all on function private.enqueue_notification(uuid,uuid,text,text,text,text,jsonb,text) from public,anon,authenticated;

create or replace function private.notify_review_comment()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; parent_owner uuid; work_ref text; actor_name text;
begin
  if new.is_deleted then return new; end if;
  select r.user_id,r.work_id into owner_id,work_ref from public.reviews r where r.id=new.review_id;
  select coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy') into actor_name from public.profiles p where p.id=new.user_id;
  if new.parent_id is not null then
    select c.user_id into parent_owner from public.review_comments c
    where c.id=new.parent_id and c.review_id=new.review_id and not c.is_deleted;
  end if;
  perform private.enqueue_notification(owner_id,new.user_id,'comment','تعليق جديد',
    coalesce(actor_name,'قارئ Lorefy')||' علّق على مراجعتك','/review/'||new.review_id::text,
    jsonb_build_object('event','review_comment','reviewId',new.review_id,'commentId',new.id,'parentCommentId',new.parent_id,'workId',work_ref),
    'comment:'||new.id::text);
  if parent_owner is distinct from owner_id then
    perform private.enqueue_notification(parent_owner,new.user_id,'comment','رد على تعليقك',
      coalesce(actor_name,'قارئ Lorefy')||' رد على تعليقك','/review/'||new.review_id::text,
      jsonb_build_object('event','review_reply','reviewId',new.review_id,'commentId',new.id,'parentCommentId',new.parent_id,'workId',work_ref),
      'comment-reply:'||new.id::text||':'||parent_owner::text);
  end if;
  return new;
end;
$$;
revoke all on function private.notify_review_comment() from public,anon,authenticated;

create or replace function private.notify_review_reaction()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; work_ref text; actor_name text; negative boolean:=new.kind='dislike';
begin
  if new.kind not in ('like','heart','dislike') then return new; end if;
  select r.user_id,r.work_id into owner_id,work_ref from public.reviews r where r.id=new.review_id;
  select coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy') into actor_name from public.profiles p where p.id=new.user_id;
  perform private.enqueue_notification(owner_id,new.user_id,'reaction',case when negative then 'تفاعل جديد' else 'إعجاب جديد' end,
    coalesce(actor_name,'قارئ Lorefy')||case when negative then ' لم تعجبه مراجعتك' else ' أعجب بمراجعتك' end,
    '/review/'||new.review_id::text,
    jsonb_build_object('event',case when negative then 'review_dislike' else 'review_like' end,'reviewId',new.review_id,'reaction',new.kind,'workId',work_ref),
    'reaction:'||new.review_id::text||':'||new.user_id::text||':'||new.kind);
  return new;
end;
$$;
revoke all on function private.notify_review_reaction() from public,anon,authenticated;

create or replace function private.notify_profile_follow()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare actor_name text;
begin
  select coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy') into actor_name from public.profiles p where p.id=new.follower_id;
  perform private.enqueue_notification(new.following_id,new.follower_id,'follow','متابع جديد',
    coalesce(actor_name,'قارئ Lorefy')||' بدأ بمتابعتك','/profile',
    jsonb_build_object('event','follow','profileId',new.follower_id),
    'follow:'||new.follower_id::text||':'||new.following_id::text);
  return new;
end;
$$;
revoke all on function private.notify_profile_follow() from public,anon,authenticated;

-- Keep the root thread for pagination and only persist a server-validated reply target.
create or replace function public.publish_community_post(
  post_body text, post_kind text default 'text', post_attachment jsonb default '{}'::jsonb, parent_ref uuid default null
)
returns public.community_posts language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  uid uuid:=auth.uid(); clean_body text:=trim(coalesce(post_body,''));
  clean_attachment jsonb:=coalesce(post_attachment,'{}'::jsonb);
  parent_post public.community_posts; reply_post public.community_posts; row_out public.community_posts;
  reply_ref text; reply_username text;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if post_kind not in ('text','list','top') then raise exception 'invalid_post_kind' using errcode='22023'; end if;
  if jsonb_typeof(clean_attachment)<>'object' or pg_column_size(clean_attachment)>32768 then
    raise exception 'invalid_post_attachment' using errcode='22023';
  end if;
  if char_length(clean_body)>1000 or (clean_body='' and clean_attachment='{}'::jsonb) then
    raise exception 'invalid_post_body' using errcode='22023';
  end if;
  if post_kind in ('list','top') and (
    char_length(trim(coalesce(clean_attachment->>'title','')))=0
    or jsonb_typeof(clean_attachment->'items') is distinct from 'array'
    or jsonb_array_length(clean_attachment->'items')>10
  ) then raise exception 'invalid_post_attachment' using errcode='22023'; end if;
  if parent_ref is not null then
    select * into parent_post from public.community_posts where id=parent_ref and not is_deleted;
    if not found then raise exception 'post_not_found' using errcode='P0002'; end if;
    if parent_post.user_id<>uid and not exists (
      select 1 from public.profiles p where p.id=parent_post.user_id and p.is_private=false
      and not private.author_has_blocked_viewer(p.id) and not private.reader_has_blocked_author(p.id)
    ) then raise exception 'post_not_found' using errcode='P0002'; end if;
    if parent_post.parent_id is not null then parent_ref:=parent_post.parent_id; end if;
    -- The root must remain visible even when the requested parent is the actor's own reply.
    if not exists (
      select 1 from public.community_posts c join public.profiles p on p.id=c.user_id
      where c.id=parent_ref and not c.is_deleted and (c.user_id=uid or
        (not p.is_private and not private.author_has_blocked_viewer(p.id) and not private.reader_has_blocked_author(p.id)))
    ) then raise exception 'post_not_found' using errcode='P0002'; end if;
    reply_ref:=clean_attachment#>>'{replyTo,id}';
    if reply_ref is null and parent_post.id<>parent_ref then reply_ref:=parent_post.id::text; end if;
    clean_attachment:='{}'::jsonb; post_kind:='text';
    if reply_ref is not null then
      if reply_ref!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'invalid_reply_target' using errcode='22023';
      end if;
      select * into reply_post from public.community_posts c where c.id=reply_ref::uuid and not c.is_deleted
        and (c.id=parent_ref or c.parent_id=parent_ref);
      if not found then raise exception 'invalid_reply_target' using errcode='22023'; end if;
      if reply_post.user_id<>uid and not exists (
        select 1 from public.profiles p where p.id=reply_post.user_id and not p.is_private
        and not private.author_has_blocked_viewer(p.id) and not private.reader_has_blocked_author(p.id)
      ) then raise exception 'invalid_reply_target' using errcode='22023'; end if;
      select p.username into reply_username from public.profiles p where p.id=reply_post.user_id;
      clean_attachment:=jsonb_build_object('replyTo',jsonb_build_object('id',reply_post.id,'username',left(coalesce(reply_username,''),80)));
    end if;
    if clean_body='' then raise exception 'invalid_post_body' using errcode='22023'; end if;
  end if;
  perform private.lock_actor_action('post');
  if (select count(*) from public.community_posts where user_id=uid and created_at>now()-interval '1 hour')>=40 then
    raise exception 'post_rate_limit' using errcode='P0001';
  end if;
  insert into public.community_posts(user_id,kind,body,attachment,parent_id)
  values(uid,post_kind,clean_body,clean_attachment,parent_ref) returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_community_post(text,text,jsonb,uuid) from public,anon;
grant execute on function public.publish_community_post(text,text,jsonb,uuid) to authenticated;

create or replace function private.notify_community_post_reply()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; reply_owner uuid; reply_ref text; actor_name text;
begin
  if new.parent_id is null or new.is_deleted then return new; end if;
  select c.user_id into owner_id from public.community_posts c where c.id=new.parent_id and not c.is_deleted;
  select coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy') into actor_name from public.profiles p where p.id=new.user_id;
  perform private.enqueue_notification(owner_id,new.user_id,'comment','رد جديد',
    coalesce(actor_name,'قارئ Lorefy')||' رد على منشورك','/community',
    jsonb_build_object('event','post_reply','postId',new.parent_id,'replyId',new.id),'post-reply:'||new.id::text);
  reply_ref:=new.attachment#>>'{replyTo,id}';
  if reply_ref~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select c.user_id into reply_owner from public.community_posts c where c.id=reply_ref::uuid
      and c.parent_id=new.parent_id and not c.is_deleted;
    if reply_owner is distinct from owner_id then
      perform private.enqueue_notification(reply_owner,new.user_id,'comment','رد على تعليقك',
        coalesce(actor_name,'قارئ Lorefy')||' رد على تعليقك','/community',
        jsonb_build_object('event','post_reply_reply','postId',new.parent_id,'replyId',new.id),
        'post-reply-target:'||new.id::text||':'||reply_owner::text);
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_community_post_reply() from public,anon,authenticated;

create or replace function private.notify_community_post_like()
returns trigger language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; root_id uuid; actor_name text; negative boolean:=new.kind='dislike';
begin
  if new.kind not in ('like','dislike') then return new; end if;
  select c.user_id,coalesce(c.parent_id,c.id) into owner_id,root_id from public.community_posts c where c.id=new.post_id and not c.is_deleted;
  select coalesce(nullif(p.name,''),nullif(p.username,''),'قارئ Lorefy') into actor_name from public.profiles p where p.id=new.user_id;
  perform private.enqueue_notification(owner_id,new.user_id,'reaction',case when negative then 'تفاعل جديد' else 'إعجاب جديد' end,
    coalesce(actor_name,'قارئ Lorefy')||case when negative then ' لم يعجبه منشورك' else ' أعجب بمنشورك' end,'/community',
    jsonb_build_object('event',case when negative then 'post_dislike' else 'post_like' end,'postId',root_id,'replyId',case when root_id<>new.post_id then new.post_id end,'reaction',new.kind),
    case when negative then 'post-dislike:' else 'post-like:' end||new.post_id::text||':'||new.user_id::text);
  return new;
end;
$$;
revoke all on function private.notify_community_post_like() from public,anon,authenticated;

commit;
