begin;
do $$
declare
  author_id uuid := gen_random_uuid();
  viewer_id uuid := gen_random_uuid();
  review_ref uuid := gen_random_uuid();
  visible_count integer;
begin
  insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
  values(author_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',author_id::text || '@example.invalid',now(),'{}','{}',now(),now()),
        (viewer_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',viewer_id::text || '@example.invalid',now(),'{}','{}',now(),now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',author_id,'role','authenticated')::text,true);
  perform public.publish_review(review_ref,'qa-privacy',4,'QA privacy review',true,false,'{}',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id,'role','authenticated')::text,true);
  set local role authenticated;
  select count(*) into visible_count from public.reviews where id=review_ref;
  if visible_count <> 1 then raise exception 'public_review_not_visible'; end if;
  reset role;
  update public.profiles set is_private=true where id=author_id;
  set local role authenticated;
  select count(*) into visible_count from public.reviews where id=review_ref;
  if visible_count <> 0 then raise exception 'private_account_review_leaked'; end if;
  begin
    perform public.publish_review_comment(review_ref,'Must not publish',null);
    raise exception 'private_review_comment_allowed';
  exception when no_data_found then
    if sqlerrm <> 'review_not_found' then raise; end if;
  end;
  begin
    perform public.set_review_reaction(review_ref,'like',true);
    raise exception 'private_review_reaction_allowed';
  exception when no_data_found then
    if sqlerrm <> 'review_not_found' then raise; end if;
  end;
  reset role;
  if private.can_interact_with_review(review_ref) then raise exception 'private_review_interaction_allowed'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',author_id,'role','authenticated')::text,true);
  set local role authenticated;
  select count(*) into visible_count from public.reviews where id=review_ref;
  if visible_count <> 1 then raise exception 'owner_private_review_missing'; end if;
  reset role;
  update public.profiles set is_private=false where id=author_id;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id,'role','authenticated')::text,true);
  set local role authenticated;
  insert into public.profile_blocks(blocker_id,blocked_id) values(viewer_id,author_id);
  select count(*) into visible_count from public.reviews where id=review_ref;
  if visible_count <> 0 then raise exception 'blocked_review_visible'; end if;
  reset role;
end;
$$;
rollback;
