-- Supports reverse follow lookups used by profile and reader discovery screens.
create index if not exists profile_follows_following_idx
  on public.profile_follows (following_id, created_at desc);
