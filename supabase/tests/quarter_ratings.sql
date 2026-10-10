begin;
do $$
declare
  actor uuid := gen_random_uuid();
  review_ref uuid := gen_random_uuid();
  chapter_ref uuid;
  actual numeric;
begin
  insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
  values(actor,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',actor::text || '@example.invalid',now(),'{}','{}',now(),now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  set local role authenticated;
  perform public.publish_review(review_ref,'qa-quarter-rating',4.25,'Quarter rating QA',true,false,'{}',true);
  select rating into actual from public.reviews where id=review_ref;
  if actual <> 4.25 then raise exception 'work_quarter_precision_lost: %',actual; end if;
  perform public.publish_review(review_ref,'qa-quarter-rating',4.75,'Quarter update QA',true,false,'{}',true);
  select rating into actual from public.reviews where id=review_ref;
  if actual <> 4.75 then raise exception 'work_quarter_update_lost'; end if;
  select id into chapter_ref from public.publish_chapter_review('qa-quarter-rating',2,4.25::numeric,'Chapter quarter QA',false);
  select rating into actual from public.chapter_reviews where id=chapter_ref;
  if actual <> 4.25 then raise exception 'chapter_quarter_precision_lost'; end if;
  perform public.publish_chapter_review('qa-quarter-rating',2,4.75::numeric,'Chapter quarter update QA',false);
  select rating into actual from public.chapter_reviews where id=chapter_ref;
  if actual <> 4.75 then raise exception 'chapter_quarter_update_lost'; end if;
  begin
    perform public.publish_chapter_review('qa-quarter-rating',3,4.2::numeric,'Invalid step',false);
    raise exception 'non_quarter_rating_allowed';
  exception when invalid_parameter_value then null;
  end;
  perform public.publish_chapter_review('qa-quarter-rating',3,0::numeric,'Comment only',false);
  reset role;
end;
$$;
rollback;
