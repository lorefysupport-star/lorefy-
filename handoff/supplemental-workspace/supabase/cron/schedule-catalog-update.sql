-- Run once after deploying supabase/functions/catalog-update.
-- Replace the two secret values before executing, or create them in the
-- Supabase Dashboard under Vault and keep the names below.

select vault.create_secret(
  'https://PROJECT_REF.functions.supabase.co/catalog-update',
  'catalog_update_url'
);

select vault.create_secret(
  'CHANGE_ME_TO_A_LONG_RANDOM_SECRET',
  'catalog_update_secret'
);

select cron.schedule(
  'lorefy-weekly-catalog-update',
  '0 3 * * 1',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'catalog_update_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-catalog-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'catalog_update_secret')
    ),
    body := jsonb_build_object('trigger', 'cron', 'time', now())
  ) as request_id;
  $$
);
