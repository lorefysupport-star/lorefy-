-- Enforce one canonical username per reader and one review per reader/work.
-- Existing profile saves and review publishing already use these same keys;
-- these indexes make the rule hold for every authenticated client.

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

create unique index if not exists reviews_user_work_unique_idx
  on public.reviews (user_id, work_id);
