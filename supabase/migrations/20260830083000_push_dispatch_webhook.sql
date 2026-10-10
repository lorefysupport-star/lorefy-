-- Deliver notification inserts to the protected Edge Function asynchronously.
-- The matching header value is stored only in Supabase Vault.

create extension if not exists pg_net;

create or replace function private.dispatch_notification_push()
returns trigger
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, private, vault, net, pg_temp
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'lorefy_push_webhook_secret';

  if webhook_secret is null or char_length(webhook_secret) < 32 then
    raise warning 'Lorefy push webhook secret is not configured';
    return new;
  end if;

  perform net.http_post(
    url := 'https://qsroxmltioxqozmykens.supabase.co/functions/v1/dispatch-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-lorefy-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'schema', 'public',
      'table', 'notifications',
      'record', jsonb_build_object('id', new.id, 'user_id', new.user_id)
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

revoke all on function private.dispatch_notification_push() from public, anon, authenticated;

drop trigger if exists dispatch_notification_push on public.notifications;
create trigger dispatch_notification_push
after insert on public.notifications
for each row execute function private.dispatch_notification_push();
