-- Server-owned notification inbox and private native push token registry.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installation_id uuid not null,
  platform text not null check (platform in ('ios', 'android')),
  token text not null check (char_length(token) between 32 and 4096),
  environment text not null default 'production' check (environment in ('development', 'production')),
  locale text not null default 'ar' check (char_length(locale) between 2 and 16),
  app_version text not null default '' check (char_length(app_version) <= 32),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, installation_id),
  unique (platform, token)
);

alter table public.push_device_tokens enable row level security;
revoke all on table public.push_device_tokens from public, anon, authenticated;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('comment', 'reaction', 'follow', 'chapter', 'system')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  target_path text not null check (
    target_path in ('/home', '/community', '/notifications', '/library', '/profile')
    or target_path ~ '^/work/[A-Za-z0-9._:-]{1,200}$'
    or target_path ~ '^/review/[0-9a-f-]{36}$'
  ),
  data jsonb not null default '{}'::jsonb check (
    jsonb_typeof(data) = 'object' and pg_column_size(data) <= 8192
  ),
  event_key text not null unique check (char_length(event_key) between 3 and 300),
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_unread_created_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

alter table public.notifications enable row level security;
revoke all on table public.notifications from public, anon, authenticated;
grant select on table public.notifications to authenticated;

create policy "Readers can view their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.register_push_device(
  installation_ref uuid,
  device_platform text,
  device_token text,
  push_environment text default 'production',
  device_locale text default 'ar',
  client_version text default ''
)
returns uuid
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  row_id uuid;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if installation_ref is null then raise exception 'invalid_installation' using errcode = '22023'; end if;
  if device_platform not in ('ios', 'android') then raise exception 'invalid_platform' using errcode = '22023'; end if;
  if char_length(trim(coalesce(device_token, ''))) not between 32 and 4096 then
    raise exception 'invalid_push_token' using errcode = '22023';
  end if;
  if push_environment not in ('development', 'production') then
    raise exception 'invalid_push_environment' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(device_locale, ''))) not between 2 and 16
     or char_length(trim(coalesce(client_version, ''))) > 32 then
    raise exception 'invalid_device_metadata' using errcode = '22023';
  end if;

  -- An installation belongs to only the currently authenticated account.
  delete from public.push_device_tokens
  where installation_id = installation_ref
     or (platform = device_platform and token = trim(device_token));

  insert into public.push_device_tokens (
    user_id, installation_id, platform, token, environment, locale, app_version
  ) values (
    uid, installation_ref, device_platform, trim(device_token), push_environment,
    lower(trim(device_locale)), trim(client_version)
  ) returning id into row_id;

  return row_id;
end;
$$;
revoke all on function public.register_push_device(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.register_push_device(uuid, text, text, text, text, text) to authenticated;

create or replace function public.unregister_push_device(installation_ref uuid)
returns boolean
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  removed_count integer;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  delete from public.push_device_tokens
  where user_id = uid and installation_id = installation_ref;
  get diagnostics removed_count = row_count;
  return removed_count > 0;
end;
$$;
revoke all on function public.unregister_push_device(uuid) from public, anon;
grant execute on function public.unregister_push_device(uuid) to authenticated;

create or replace function public.mark_notifications_read(notification_ids uuid[] default null)
returns integer
language plpgsql volatile security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  updated_count integer;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if notification_ids is not null and cardinality(notification_ids) > 200 then
    raise exception 'too_many_notifications' using errcode = '22023';
  end if;
  update public.notifications
  set read_at = coalesce(read_at, timezone('utc', now()))
  where user_id = uid
    and read_at is null
    and (notification_ids is null or id = any(notification_ids));
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function private.enqueue_notification(
  recipient_id uuid,
  actor_ref uuid,
  notification_kind text,
  notification_title text,
  notification_body text,
  destination_path text,
  payload jsonb,
  dedupe_key text
)
returns void
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if recipient_id is null or recipient_id = actor_ref then return; end if;
  insert into public.notifications (
    user_id, actor_id, kind, title, body, target_path, data, event_key
  ) values (
    recipient_id, actor_ref, notification_kind, left(notification_title, 120),
    left(coalesce(notification_body, ''), 500), destination_path,
    coalesce(payload, '{}'::jsonb), left(dedupe_key, 300)
  ) on conflict (event_key) do nothing;
end;
$$;
revoke all on function private.enqueue_notification(uuid, uuid, text, text, text, text, jsonb, text)
  from public, anon, authenticated;

create or replace function private.notify_review_comment()
returns trigger
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  owner_id uuid;
  work_ref text;
  actor_name text;
begin
  select r.user_id, r.work_id into owner_id, work_ref
  from public.reviews r where r.id = new.review_id;
  select coalesce(nullif(p.name, ''), nullif(p.username, ''), 'قارئ Lorefy') into actor_name
  from public.profiles p where p.id = new.user_id;
  perform private.enqueue_notification(
    owner_id, new.user_id, 'comment', 'رد جديد',
    coalesce(actor_name, 'قارئ Lorefy') || ' رد على مراجعتك',
    '/review/' || new.review_id::text,
    jsonb_build_object('reviewId', new.review_id, 'commentId', new.id, 'workId', work_ref),
    'comment:' || new.id::text
  );
  return new;
end;
$$;
revoke all on function private.notify_review_comment() from public, anon, authenticated;

create or replace function private.notify_review_reaction()
returns trigger
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  owner_id uuid;
  work_ref text;
  actor_name text;
begin
  if new.kind not in ('like', 'heart') then return new; end if;
  select r.user_id, r.work_id into owner_id, work_ref
  from public.reviews r where r.id = new.review_id;
  select coalesce(nullif(p.name, ''), nullif(p.username, ''), 'قارئ Lorefy') into actor_name
  from public.profiles p where p.id = new.user_id;
  perform private.enqueue_notification(
    owner_id, new.user_id, 'reaction', 'تفاعل جديد',
    coalesce(actor_name, 'قارئ Lorefy') || ' أعجب بمراجعتك',
    '/review/' || new.review_id::text,
    jsonb_build_object('reviewId', new.review_id, 'reaction', new.kind, 'workId', work_ref),
    'reaction:' || new.review_id::text || ':' || new.user_id::text || ':' || new.kind
  );
  return new;
end;
$$;
revoke all on function private.notify_review_reaction() from public, anon, authenticated;

create or replace function private.notify_profile_follow()
returns trigger
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  actor_name text;
begin
  select coalesce(nullif(p.name, ''), nullif(p.username, ''), 'قارئ Lorefy') into actor_name
  from public.profiles p where p.id = new.follower_id;
  perform private.enqueue_notification(
    new.following_id, new.follower_id, 'follow', 'متابع جديد',
    coalesce(actor_name, 'قارئ Lorefy') || ' بدأ بمتابعتك',
    '/profile', jsonb_build_object('profileId', new.follower_id),
    'follow:' || new.follower_id::text || ':' || new.following_id::text
  );
  return new;
end;
$$;
revoke all on function private.notify_profile_follow() from public, anon, authenticated;

drop trigger if exists notify_review_comment on public.review_comments;
create trigger notify_review_comment
after insert on public.review_comments
for each row execute function private.notify_review_comment();

drop trigger if exists notify_review_reaction on public.review_reactions;
create trigger notify_review_reaction
after insert on public.review_reactions
for each row execute function private.notify_review_reaction();

drop trigger if exists notify_profile_follow on public.profile_follows;
create trigger notify_profile_follow
after insert on public.profile_follows
for each row execute function private.notify_profile_follow();
