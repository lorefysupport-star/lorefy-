-- Standalone Lorefy community posts, threaded replies, and lightweight reactions.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('text', 'list', 'top')),
  body text not null default '' check (char_length(body) <= 1000),
  attachment jsonb not null default '{}'::jsonb check (
    jsonb_typeof(attachment) = 'object' and pg_column_size(attachment) <= 32768
  ),
  parent_id uuid references public.community_posts(id) on delete cascade,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_posts_has_content check (
    char_length(trim(body)) > 0 or attachment <> '{}'::jsonb
  )
);

create index if not exists community_posts_root_created_idx
  on public.community_posts (created_at desc) where parent_id is null and is_deleted = false;
create index if not exists community_posts_parent_created_idx
  on public.community_posts (parent_id, created_at) where parent_id is not null and is_deleted = false;
create index if not exists community_posts_user_created_idx
  on public.community_posts (user_id, created_at desc) where is_deleted = false;

create table if not exists public.community_post_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like', 'dislike')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id, kind)
);

create index if not exists community_post_reactions_post_idx
  on public.community_post_reactions (post_id, created_at desc);

alter table public.community_posts enable row level security;
alter table public.community_post_reactions enable row level security;
revoke all on table public.community_posts from public, anon, authenticated;
revoke all on table public.community_post_reactions from public, anon, authenticated;
grant select on table public.community_posts to authenticated;
grant select on table public.community_post_reactions to authenticated;

drop policy if exists "Readers can view community posts" on public.community_posts;
create policy "Readers can view community posts"
  on public.community_posts for select to authenticated
  using (
    not is_deleted
    and (
      user_id = (select auth.uid())
      or exists (
        select 1 from public.profiles p
        where p.id = user_id
          and p.is_private = false
          and not private.author_has_blocked_viewer(p.id)
          and not private.reader_has_blocked_author(p.id)
      )
    )
  );

drop policy if exists "Readers can view community post reactions" on public.community_post_reactions;
create policy "Readers can view community post reactions"
  on public.community_post_reactions for select to authenticated
  using (
    exists (
      select 1 from public.community_posts p
      where p.id = post_id and not p.is_deleted
    )
  );

create or replace function public.publish_community_post(
  post_body text,
  post_kind text default 'text',
  post_attachment jsonb default '{}'::jsonb,
  parent_ref uuid default null
)
returns public.community_posts
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  clean_body text := trim(coalesce(post_body, ''));
  clean_attachment jsonb := coalesce(post_attachment, '{}'::jsonb);
  parent_post public.community_posts;
  row_out public.community_posts;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if post_kind not in ('text', 'list', 'top') then
    raise exception 'invalid_post_kind' using errcode = '22023';
  end if;
  if jsonb_typeof(clean_attachment) <> 'object' or pg_column_size(clean_attachment) > 32768 then
    raise exception 'invalid_post_attachment' using errcode = '22023';
  end if;
  if char_length(clean_body) > 1000 or (clean_body = '' and clean_attachment = '{}'::jsonb) then
    raise exception 'invalid_post_body' using errcode = '22023';
  end if;
  if post_kind in ('list', 'top') and (
    char_length(trim(coalesce(clean_attachment ->> 'title', ''))) = 0
    or jsonb_typeof(clean_attachment -> 'items') is distinct from 'array'
    or jsonb_array_length(clean_attachment -> 'items') > 10
  ) then
    raise exception 'invalid_post_attachment' using errcode = '22023';
  end if;
  if parent_ref is not null then
    select * into parent_post from public.community_posts
    where id = parent_ref and not is_deleted;
    if not found then raise exception 'post_not_found' using errcode = 'P0002'; end if;
    if parent_post.user_id <> uid and not exists (
      select 1 from public.profiles p where p.id = parent_post.user_id and p.is_private = false
      and not private.author_has_blocked_viewer(p.id) and not private.reader_has_blocked_author(p.id)
    ) then raise exception 'post_not_found' using errcode = 'P0002'; end if;
    if parent_post.parent_id is not null then parent_ref := parent_post.parent_id; end if;
    post_kind := 'text';
    clean_attachment := '{}'::jsonb;
  end if;

  perform private.lock_actor_action('post');
  if (select count(*) from public.community_posts where user_id = uid and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'post_rate_limit' using errcode = 'P0001';
  end if;

  insert into public.community_posts(user_id, kind, body, attachment, parent_id)
  values(uid, post_kind, clean_body, clean_attachment, parent_ref)
  returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.publish_community_post(text, text, jsonb, uuid) from public, anon;
grant execute on function public.publish_community_post(text, text, jsonb, uuid) to authenticated;

create or replace function public.set_community_post_reaction(
  post_ref uuid,
  reaction_kind text default 'like',
  reaction_active boolean default true
)
returns boolean
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  if reaction_kind not in ('like', 'dislike') then
    raise exception 'invalid_reaction_kind' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.community_posts c where c.id = post_ref and not c.is_deleted
    and (c.user_id = uid or exists (
      select 1 from public.profiles p where p.id = c.user_id and p.is_private = false
      and not private.author_has_blocked_viewer(p.id) and not private.reader_has_blocked_author(p.id)
    ))
  ) then
    raise exception 'post_not_found' using errcode = 'P0002';
  end if;
  perform private.lock_actor_action('reaction');
  if reaction_active then
    delete from public.community_post_reactions
    where post_id = post_ref and user_id = uid and kind <> reaction_kind;
    insert into public.community_post_reactions(post_id, user_id, kind)
    values(post_ref, uid, reaction_kind) on conflict do nothing;
  else
    delete from public.community_post_reactions
    where post_id = post_ref and user_id = uid and kind = reaction_kind;
  end if;
  return reaction_active;
end;
$$;
revoke all on function public.set_community_post_reaction(uuid, text, boolean) from public, anon;
grant execute on function public.set_community_post_reaction(uuid, text, boolean) to authenticated;

drop trigger if exists moderate_community_posts_text on public.community_posts;
create trigger moderate_community_posts_text
before insert or update of body on public.community_posts
for each row execute function public.moderate_community_text();

create or replace function private.notify_community_post_reply()
returns trigger
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; actor_name text;
begin
  if new.parent_id is null then return new; end if;
  select user_id into owner_id from public.community_posts where id = new.parent_id;
  select coalesce(nullif(name, ''), nullif(username, ''), 'قارئ Lorefy')
    into actor_name from public.profiles where id = new.user_id;
  perform private.enqueue_notification(
    owner_id, new.user_id, 'comment', 'رد جديد',
    coalesce(actor_name, 'قارئ Lorefy') || ' رد على منشورك', '/community',
    jsonb_build_object('postId', new.parent_id, 'replyId', new.id),
    'post-reply:' || new.id::text
  );
  return new;
end;
$$;
revoke all on function private.notify_community_post_reply() from public, anon, authenticated;

drop trigger if exists notify_community_post_reply on public.community_posts;
create trigger notify_community_post_reply
after insert on public.community_posts
for each row execute function private.notify_community_post_reply();

create or replace function private.notify_community_post_like()
returns trigger
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare owner_id uuid; actor_name text;
begin
  if new.kind <> 'like' then return new; end if;
  select user_id into owner_id from public.community_posts where id = new.post_id;
  select coalesce(nullif(name, ''), nullif(username, ''), 'قارئ Lorefy')
    into actor_name from public.profiles where id = new.user_id;
  perform private.enqueue_notification(
    owner_id, new.user_id, 'reaction', 'إعجاب جديد',
    coalesce(actor_name, 'قارئ Lorefy') || ' أعجب بمنشورك', '/community',
    jsonb_build_object('postId', new.post_id),
    'post-like:' || new.post_id::text || ':' || new.user_id::text
  );
  return new;
end;
$$;
revoke all on function private.notify_community_post_like() from public, anon, authenticated;

drop trigger if exists notify_community_post_like on public.community_post_reactions;
create trigger notify_community_post_like
after insert on public.community_post_reactions
for each row execute function private.notify_community_post_like();

do $$
declare target text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach target in array array['community_posts', 'community_post_reactions'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
      ) then
        execute format('alter publication supabase_realtime add table public.%I', target);
      end if;
    end loop;
  end if;
end;
$$;
