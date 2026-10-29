-- Targeted Pro follow-up, 2026-10-29. No user-data writes or grant changes.
-- Tables were inspected live: the largest affected table was 200 KiB.
-- Fail quickly rather than waiting behind an application write.
set local lock_timeout = '2s';
set local statement_timeout = '30s';

-- The feed relies on RLS for visibility, so the existing is_public-only index
-- cannot satisfy its unfiltered ORDER BY. Keep that index for its other uses.
create index if not exists reviews_feed_created_id_idx
  on public.reviews (created_at desc, id desc);

create index if not exists community_post_reactions_user_id_idx
  on public.community_post_reactions (user_id);
create index if not exists notifications_actor_id_idx
  on public.notifications (actor_id);
create index if not exists decoration_purchases_product_id_idx
  on public.decoration_purchases (product_id);
create index if not exists profile_username_reservations_user_id_idx
  on private.profile_username_reservations (user_id);

-- Refuse to replace a policy that changed since the live inspection. ALTER
-- preserves command, roles and permissiveness; only the UID evaluation changes.
do $$
declare
  visible_using text;
  delete_using text;
begin
  select regexp_replace(qual, '\s+', '', 'g') into visible_using
  from pg_policies where schemaname = 'public' and tablename = 'chapter_reviews'
    and policyname = 'Visible chapter reviews';
  select regexp_replace(qual, '\s+', '', 'g') into delete_using
  from pg_policies where schemaname = 'public' and tablename = 'chapter_reviews'
    and policyname = 'Delete own chapter review';
  if visible_using is distinct from regexp_replace(
    '((user_id = auth.uid()) OR ((NOT private.author_has_blocked_viewer(user_id)) AND (NOT private.reader_has_blocked_author(user_id)) AND (EXISTS ( SELECT 1 FROM profiles p WHERE ((p.id = chapter_reviews.user_id) AND (NOT p.is_private))))))',
    '\s+', '', 'g') or delete_using is distinct from '(user_id=auth.uid())' then
    raise exception 'chapter_review_policy_drift: inspect current policies before applying';
  end if;
end;
$$;

alter policy "Visible chapter reviews" on public.chapter_reviews
using (user_id = (select auth.uid()) or (
  not private.author_has_blocked_viewer(user_id)
  and not private.reader_has_blocked_author(user_id)
  and exists (select 1 from public.profiles p
    where p.id = chapter_reviews.user_id and not p.is_private)
));

alter policy "Delete own chapter review" on public.chapter_reviews
using (user_id = (select auth.uid()));
