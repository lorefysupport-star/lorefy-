-- All write paths, including older app versions, must preserve a chosen handle.
create or replace function private.enforce_profile_username()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.username := nullif(lower(trim(new.username)), '');

  if tg_op = 'UPDATE' and nullif(trim(old.username), '') is not null
     and new.username is distinct from lower(trim(old.username)) then
    raise exception 'username_immutable' using errcode = '22023';
  end if;

  if new.username is not null and new.username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'invalid_username' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_profile_username() from public;

create trigger enforce_profile_username
before insert or update of username on public.profiles
for each row execute function private.enforce_profile_username();

-- Existing case-insensitive uniqueness is retained. Also protect whitespace variants.
create unique index if not exists profiles_username_normalized_key
on public.profiles (lower(trim(username)))
where nullif(trim(username), '') is not null;
