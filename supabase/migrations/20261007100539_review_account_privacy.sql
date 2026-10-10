-- Version matches the migration applied to the Lorefy project.
create or replace function private.can_interact_with_review(review_ref uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.reviews r
    join public.profiles p on p.id = r.user_id
    where r.id = review_ref
      and (r.user_id = auth.uid() or (r.is_public and not p.is_private))
      and not private.author_has_blocked_viewer(r.user_id)
      and not private.reader_has_blocked_author(r.user_id)
  );
$$;
revoke all on function private.can_interact_with_review(uuid) from public, anon;
grant execute on function private.can_interact_with_review(uuid) to authenticated;

-- Comments, reactions and their RPCs already use this same access helper.
alter policy "Community reviews respect account blocks" on public.reviews
  using (private.can_interact_with_review(id));
