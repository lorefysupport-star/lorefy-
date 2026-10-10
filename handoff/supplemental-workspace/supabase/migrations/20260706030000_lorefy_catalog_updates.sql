create extension if not exists pgcrypto with schema extensions;

create table if not exists public.catalog_update_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  trigger text not null default 'manual',
  source_counts jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_deltas (
  version text primary key,
  generated_at timestamptz not null default now(),
  base_catalog_version text,
  delta jsonb not null,
  run_id uuid references public.catalog_update_runs(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_manifest (
  id boolean primary key default true check (id),
  version text not null,
  generated_at timestamptz not null default now(),
  base_catalog_version text,
  delta_version text references public.catalog_deltas(version) on delete set null,
  delta_url text not null,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.catalog_update_runs enable row level security;
alter table public.catalog_deltas enable row level security;
alter table public.catalog_manifest enable row level security;

grant select on public.catalog_manifest to anon, authenticated;
grant select on public.catalog_deltas to anon, authenticated;
grant select, insert, update, delete on public.catalog_update_runs to service_role;
grant select, insert, update, delete on public.catalog_deltas to service_role;
grant select, insert, update, delete on public.catalog_manifest to service_role;

drop policy if exists "public can read catalog manifest" on public.catalog_manifest;
create policy "public can read catalog manifest"
on public.catalog_manifest
for select
to anon, authenticated
using (true);

drop policy if exists "public can read catalog deltas" on public.catalog_deltas;
create policy "public can read catalog deltas"
on public.catalog_deltas
for select
to anon, authenticated
using (true);

drop policy if exists "service role manages catalog update runs" on public.catalog_update_runs;
create policy "service role manages catalog update runs"
on public.catalog_update_runs
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages catalog deltas" on public.catalog_deltas;
create policy "service role manages catalog deltas"
on public.catalog_deltas
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages catalog manifest" on public.catalog_manifest;
create policy "service role manages catalog manifest"
on public.catalog_manifest
for all
to service_role
using (true)
with check (true);
