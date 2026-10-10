-- Merge only locally changed state keys and reject stale writes before data loss.

alter table public.user_state
  add column if not exists version bigint not null default 0;

create or replace function public.sync_user_state(
  state_patch jsonb,
  removed_keys text[] default array[]::text[],
  expected_version bigint default 0
)
returns table(state_data jsonb, state_version bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(state_patch, '{}'::jsonb)) <> 'object'
     or (select count(*) from jsonb_object_keys(coalesce(state_patch, '{}'::jsonb))) > 20
     or cardinality(coalesce(removed_keys, array[]::text[])) > 20
     or expected_version < 0 then
    raise exception 'invalid_state_patch' using errcode = '22023';
  end if;

  insert into public.user_state as us (user_id, data, version, updated_at)
  values (uid, coalesce(state_patch, '{}'::jsonb) - coalesce(removed_keys, array[]::text[]), 1, timezone('utc', now()))
  on conflict (user_id) do nothing
  returning us.data, us.version into state_data, state_version;

  if found then
    return next;
    return;
  end if;

  update public.user_state as us
  set data = (us.data - coalesce(removed_keys, array[]::text[])) || coalesce(state_patch, '{}'::jsonb),
      version = us.version + 1,
      updated_at = timezone('utc', now())
  where user_id = uid
    and version = expected_version
  returning us.data, us.version into state_data, state_version;

  if not found then
    raise exception 'state_conflict' using errcode = 'P0001';
  end if;
  return next;
end;
$$;

revoke all on function public.sync_user_state(jsonb, text[], bigint) from public, anon;
grant execute on function public.sync_user_state(jsonb, text[], bigint) to authenticated;

revoke insert, update on public.user_state from authenticated;
grant select, delete on public.user_state to authenticated;
