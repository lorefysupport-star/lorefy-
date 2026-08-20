-- Lorefy server-authoritative subscription state.
-- Webhooks or StoreKit server notifications must be the only writers.
create table if not exists public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'apple', 'google_play')),
  product text not null,
  status text not null check (status in ('active', 'trialing', 'grace', 'canceled', 'expired', 'revoked')),
  provider_customer_id text,
  provider_subscription_id text unique,
  expires_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, provider, product)
);

create index if not exists entitlements_user_status_idx
  on public.entitlements (user_id, status, expires_at desc);

alter table public.entitlements enable row level security;

revoke all on table public.entitlements from anon;
revoke insert, update, delete on table public.entitlements from authenticated;
grant select on table public.entitlements to authenticated;

drop policy if exists "Users can read their own entitlements" on public.entitlements;
create policy "Users can read their own entitlements"
  on public.entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);
