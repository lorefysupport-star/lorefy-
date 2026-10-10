-- Synthetic users exist only inside this transaction. No email or existing user is touched.
begin;
do $$
declare
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
  old_handle text := 'qa_' || substr(replace(first_id::text,'-',''),1,12);
  new_handle text := 'qb_' || substr(replace(first_id::text,'-',''),1,12);
  blocked boolean;
begin
  insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
  values(first_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',first_id::text || '@example.invalid',now(),'{}','{}',now(),now()),
        (second_id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',second_id::text || '@example.invalid',now(),'{}','{}',now(),now());
  perform set_config('request.jwt.claims',jsonb_build_object('sub',first_id,'role','authenticated')::text,true);
  perform public.save_my_profile('QA',old_handle,'',null,null,'[]','{}',false);
  perform public.save_my_profile('QA',upper(new_handle),'',null,null,'[]','{}',false);
  if not exists(select 1 from public.profiles where id=first_id and username=new_handle) then raise exception 'rename_failed'; end if;
  if not exists(select 1 from private.profile_username_reservations where username=old_handle and user_id=first_id) then raise exception 'old_handle_not_reserved'; end if;
  blocked := false;
  begin
    update public.profiles set username=old_handle where id=first_id;
  exception when sqlstate '22023' then
    if sqlerrm <> 'username_change_cooldown' then raise; end if; blocked := true;
  end;
  if not blocked then raise exception 'cooldown_bypassed'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',second_id,'role','authenticated')::text,true);
  if public.username_is_available(old_handle) or public.username_is_available(new_handle) then raise exception 'reserved_handle_reported_available'; end if;
  blocked := false;
  begin
    perform public.save_my_profile('QA',old_handle,'',null,null,'[]','{}',false);
  exception when unique_violation then blocked := true;
  end;
  if not blocked then raise exception 'handle_takeover_allowed'; end if;
  blocked := false;
  begin
    update public.profiles set username='qa_another_name' where id=first_id;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'other_owner_rename_allowed'; end if;
  blocked := false;
  begin
    perform public.save_my_profile('QA','invalid name','',null,null,'[]','{}',false);
  exception when sqlstate '22023' then blocked := true;
  end;
  if not blocked then raise exception 'invalid_handle_allowed'; end if;
  if has_table_privilege('authenticated','private.profile_username_reservations','SELECT')
    or has_table_privilege('authenticated','private.profile_username_changes','UPDATE')
    or has_function_privilege('anon','public.username_is_available(text)','EXECUTE') then
    raise exception 'private_username_data_exposed';
  end if;
end;
$$;
rollback;
