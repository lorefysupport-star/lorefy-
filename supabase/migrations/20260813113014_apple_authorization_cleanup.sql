-- Remove both the server-only grant record and its encrypted Vault secret.

create or replace function public.delete_apple_authorization(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, vault, pg_temp
as $$
declare
  secret_id uuid;
begin
  delete from private.apple_authorizations
  where user_id = target_user_id
  returning vault_secret_id into secret_id;

  if secret_id is not null then
    delete from vault.secrets where id = secret_id;
  end if;
end;
$$;

revoke all on function public.delete_apple_authorization(uuid) from public, anon, authenticated;
grant execute on function public.delete_apple_authorization(uuid) to service_role;
