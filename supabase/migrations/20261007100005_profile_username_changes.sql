-- Keep identity UUIDs and old handles reserved; rename never changes ownership.
-- Version matches the migration applied to the Lorefy project.
create table if not exists private.profile_username_reservations (
  username text primary key check (username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid not null references auth.users(id) on delete cascade
);
create table if not exists private.profile_username_changes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  changed_at timestamptz not null default now()
);
alter table private.profile_username_reservations enable row level security;
alter table private.profile_username_changes enable row level security;
revoke all on private.profile_username_reservations, private.profile_username_changes from public, anon, authenticated;

create or replace function private.enforce_profile_username()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  last_change timestamptz;
  reserved_owner uuid;
begin
  new.username := nullif(lower(trim(new.username)), '');
  if new.username is not null and new.username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;
  if tg_op = 'UPDATE' and new.username is not distinct from old.username then return new; end if;
  if tg_op = 'UPDATE' and old.username is not null then
    if auth.uid() is distinct from new.id or not private.is_active_auth_user() then
      raise exception 'authentication_required' using errcode = '42501';
    end if;
    if new.username is null then raise exception 'invalid_username' using errcode = '22023'; end if;
    -- Direct owner UPDATE and the RPC share the same lock and cooldown.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.id::text, 7201));
    select changed_at into last_change from private.profile_username_changes where user_id = new.id;
    if last_change > now() - interval '7 days' then
      raise exception 'username_change_cooldown' using errcode = '22023';
    end if;
    insert into private.profile_username_reservations(username,user_id)
      values(old.username,new.id) on conflict (username) do nothing;
    insert into private.profile_username_changes(user_id,changed_at) values(new.id,now())
      on conflict (user_id) do update set changed_at = excluded.changed_at;
  end if;
  if new.username is not null then
    select user_id into reserved_owner from private.profile_username_reservations where username = new.username;
    if reserved_owner is not null and reserved_owner <> new.id then
      raise exception 'username_taken' using errcode = '23505';
    end if;
    insert into private.profile_username_reservations(username,user_id) values(new.username,new.id)
      on conflict (username) do update set user_id = excluded.user_id
      where private.profile_username_reservations.user_id = excluded.user_id;
    if not found then raise exception 'username_taken' using errcode = '23505'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.enforce_profile_username() from public, anon, authenticated;

create or replace function public.username_is_available(requested_username text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  clean_username text := lower(trim(regexp_replace(coalesce(requested_username, ''), '^@', '')));
begin
  if not private.is_active_auth_user() then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if clean_username !~ '^[a-z0-9_]{3,24}$' then return false; end if;
  return not exists (select 1 from public.profiles where lower(username) = clean_username and id <> uid)
    and not exists (select 1 from private.profile_username_reservations where username = clean_username and user_id <> uid);
end;
$$;
revoke all on function public.username_is_available(text) from public, anon;
grant execute on function public.username_is_available(text) to authenticated;
