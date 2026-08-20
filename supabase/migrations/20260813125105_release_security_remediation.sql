-- Close community interaction gaps and make Apple grant storage service-owned.

drop policy if exists "Profile media can be uploaded by its owner" on storage.objects;
drop policy if exists "Profile media can be replaced by its owner" on storage.objects;

create or replace function private.can_interact_with_review(review_ref uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.reviews r
    where r.id = review_ref
      and (r.is_public or r.user_id = auth.uid())
      and not private.author_has_blocked_viewer(r.user_id)
      and not private.reader_has_blocked_author(r.user_id)
  );
$$;

revoke all on function private.can_interact_with_review(uuid) from public, anon;
grant execute on function private.can_interact_with_review(uuid) to authenticated;

drop policy if exists "Community comments respect account blocks" on public.review_comments;
create policy "Community comments inherit review access"
  on public.review_comments for select to authenticated
  using (
    not is_deleted
    and private.can_interact_with_review(review_id)
    and not private.author_has_blocked_viewer(user_id)
    and not private.reader_has_blocked_author(user_id)
  );

drop policy if exists "review reactions read" on public.review_reactions;
create policy "Review reactions inherit review access"
  on public.review_reactions for select to authenticated
  using (private.can_interact_with_review(review_id));

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

create or replace function public.set_review_reaction(review_ref uuid, reaction_kind text, reaction_active boolean default true)
returns boolean language plpgsql security definer set search_path=public,pg_temp
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if reaction_kind not in ('like','dislike','heart') then raise exception 'invalid_reaction' using errcode='22023'; end if;
  if not private.can_interact_with_review(review_ref) then raise exception 'review_not_found' using errcode='P0002'; end if;
  if reaction_active then
    insert into public.review_reactions(review_id,user_id,kind)
    values(review_ref,uid,reaction_kind) on conflict do nothing;
  else
    delete from public.review_reactions
    where review_id=review_ref and user_id=uid and kind=reaction_kind;
  end if;
  return reaction_active;
end;
$$;
revoke all on function public.set_review_reaction(uuid,text,boolean) from public,anon;
grant execute on function public.set_review_reaction(uuid,text,boolean) to authenticated;

drop policy if exists "Readers can follow profiles themselves" on public.profile_follows;
create policy "Readers can follow unblocked profiles"
  on public.profile_follows for insert to authenticated
  with check (
    (select auth.uid()) = follower_id
    and follower_id <> following_id
    and not private.author_has_blocked_viewer(following_id)
    and not private.reader_has_blocked_author(following_id)
  );

drop function if exists public.store_apple_authorization(text,text);
create or replace function public.store_apple_authorization(
  target_user_id uuid,
  refresh_token text,
  apple_subject text
)
returns void
language plpgsql
security definer
set search_path = public, private, vault, auth, pg_temp
as $$
declare current_secret_id uuid;
begin
  if target_user_id is null or not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if refresh_token is null or char_length(refresh_token) not between 10 and 4096
     or apple_subject is null or char_length(apple_subject) not between 1 and 255 then
    raise exception 'invalid_apple_authorization' using errcode = '22023';
  end if;

  select vault_secret_id into current_secret_id
  from private.apple_authorizations
  where user_id = target_user_id
  for update;

  if current_secret_id is null then
    current_secret_id := vault.create_secret(refresh_token, 'apple-refresh-' || target_user_id::text, 'Lorefy Sign in with Apple refresh token');
  else
    perform vault.update_secret(current_secret_id, refresh_token, 'apple-refresh-' || target_user_id::text, 'Lorefy Sign in with Apple refresh token');
  end if;

  insert into private.apple_authorizations(user_id, vault_secret_id, apple_subject, updated_at)
  values(target_user_id, current_secret_id, apple_subject, timezone('utc', now()))
  on conflict(user_id) do update
  set vault_secret_id = excluded.vault_secret_id,
      apple_subject = excluded.apple_subject,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.store_apple_authorization(uuid,text,text) from public, anon, authenticated;
grant execute on function public.store_apple_authorization(uuid,text,text) to service_role;

-- Serialize per-user quotas so concurrent requests cannot bypass count checks.
create or replace function private.lock_actor_action(action_name text)
returns void
language plpgsql volatile security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || action_name, 0));
end;
$$;
revoke all on function private.lock_actor_action(text) from public, anon;
grant execute on function private.lock_actor_action(text) to authenticated;

-- Mark deletion before media cleanup so storage policies reject racing uploads.
create table if not exists private.account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now())
);
revoke all on table private.account_deletions from public, anon, authenticated;

create or replace function public.begin_account_deletion(target_user_id uuid)
returns void
language plpgsql security definer
set search_path = private, auth, pg_temp
as $$
begin
  if target_user_id is null or not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  insert into private.account_deletions(user_id) values(target_user_id)
  on conflict(user_id) do update set started_at = excluded.started_at;
end;
$$;
revoke all on function public.begin_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.begin_account_deletion(uuid) to service_role;

create or replace function private.is_active_auth_user()
returns boolean
language sql stable security definer
set search_path = pg_catalog, auth, private
as $$
  select auth.uid() is not null
    and exists (select 1 from auth.users where id = auth.uid())
    and not exists (select 1 from private.account_deletions where user_id = auth.uid());
$$;
revoke all on function private.is_active_auth_user() from public, anon;
grant execute on function private.is_active_auth_user() to authenticated;

-- Replace the quota-bearing RPCs with transaction-scoped actor locks.
create or replace function public.publish_review(
  review_id uuid, work_ref text, review_rating numeric, review_body text,
  review_recommend boolean, review_spoiler boolean, image_paths text[], public_visible boolean default true
)
returns public.reviews
language plpgsql security definer
set search_path = public, storage, private, pg_temp
as $$
declare uid uuid := auth.uid(); row_out public.reviews;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  perform private.lock_actor_action('review');
  if (select count(*) from public.reviews where user_id=uid and created_at>now()-interval '1 hour') >= 20 then
    raise exception 'review_rate_limit' using errcode='P0001';
  end if;
  if image_paths is null then image_paths := '{}'::text[]; end if;
  if exists (select 1 from unnest(image_paths) p where p !~ ('^' || uid::text || '/' || review_id::text || '/[0-9a-f-]+[.](jpg|png|webp)$')) then
    raise exception 'invalid_review_media_path' using errcode='22023';
  end if;
  insert into public.reviews(id,user_id,work_id,rating,body,recommend,spoiler,image_urls,is_public)
  values(review_id,uid,trim(work_ref),review_rating,left(coalesce(review_body,''),5000),review_recommend,coalesce(review_spoiler,false),image_paths,coalesce(public_visible,true))
  returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) from public,anon;
grant execute on function public.publish_review(uuid,text,numeric,text,boolean,boolean,text[],boolean) to authenticated;

create or replace function public.submit_report(target_kind text,target_ref text,report_reason text,report_details text default null)
returns uuid
language plpgsql security definer
set search_path = public, private, pg_temp
as $$
declare uid uuid := auth.uid(); new_id uuid;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if target_kind not in ('profile','review','comment','work') or report_reason not in ('spam','abuse','harassment','spoiler','misinformation','copyright') then
    raise exception 'invalid_report' using errcode='22023';
  end if;
  perform private.lock_actor_action('report');
  if (select count(*) from public.reports where reporter_id=uid and created_at>now()-interval '1 hour') >= 20 then
    raise exception 'report_rate_limit' using errcode='P0001';
  end if;
  if exists(select 1 from public.reports where reporter_id=uid and target_type=target_kind and target_id=target_ref and reason=report_reason and created_at>now()-interval '1 hour') then
    raise exception 'duplicate_report' using errcode='23505';
  end if;
  insert into public.reports(reporter_id,target_type,target_id,reason,details)
  values(uid,target_kind,left(trim(target_ref),200),report_reason,left(coalesce(report_details,''),800)) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_report(text,text,text,text) from public,anon;
grant execute on function public.submit_report(text,text,text,text) to authenticated;
