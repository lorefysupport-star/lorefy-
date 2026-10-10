-- Keep Apple refresh tokens encrypted in Supabase Vault and inaccessible to API roles.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.apple_authorizations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vault_secret_id uuid not null unique,
  apple_subject text not null check (char_length(apple_subject) between 1 and 255),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table private.apple_authorizations enable row level security;
revoke all on private.apple_authorizations from public, anon, authenticated;

comment on table private.apple_authorizations is
  'Server-only Apple OAuth grants. Token material is encrypted in Supabase Vault.';

create or replace function public.store_apple_authorization(
  refresh_token text,
  apple_subject text
)
returns void
language plpgsql
security definer
set search_path = public, private, vault, pg_temp
as $$
declare
  uid uuid := auth.uid();
  current_secret_id uuid;
begin
  if uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if refresh_token is null or char_length(refresh_token) not between 10 and 4096
     or apple_subject is null or char_length(apple_subject) not between 1 and 255 then
    raise exception 'invalid_apple_authorization' using errcode = '22023';
  end if;

  select vault_secret_id into current_secret_id
  from private.apple_authorizations
  where user_id = uid
  for update;

  if current_secret_id is null then
    current_secret_id := vault.create_secret(
      refresh_token,
      'apple-refresh-' || uid::text,
      'Lorefy Sign in with Apple refresh token'
    );
  else
    perform vault.update_secret(
      current_secret_id,
      refresh_token,
      'apple-refresh-' || uid::text,
      'Lorefy Sign in with Apple refresh token'
    );
  end if;

  insert into private.apple_authorizations(user_id, vault_secret_id, apple_subject, updated_at)
  values(uid, current_secret_id, apple_subject, timezone('utc', now()))
  on conflict(user_id) do update
  set vault_secret_id = excluded.vault_secret_id,
      apple_subject = excluded.apple_subject,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.store_apple_authorization(text,text) from public, anon, authenticated;
grant execute on function public.store_apple_authorization(text,text) to service_role;

create or replace function public.get_apple_authorization_for_deletion(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, private, vault, pg_temp
as $$
declare
  refresh_token text;
begin
  select ds.decrypted_secret into refresh_token
  from private.apple_authorizations aa
  join vault.decrypted_secrets ds on ds.id = aa.vault_secret_id
  where aa.user_id = target_user_id;
  return refresh_token;
end;
$$;

revoke all on function public.get_apple_authorization_for_deletion(uuid) from public, anon, authenticated;
grant execute on function public.get_apple_authorization_for_deletion(uuid) to service_role;
