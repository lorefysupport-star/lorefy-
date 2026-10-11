-- Temporary access for the twelve current originals only. Receipts are unchanged.
-- The historical helper is also used by the write guard and public artwork RPC.
create or replace function private.owns_decoration(profile_ref uuid, decoration text)
returns boolean language sql stable security definer set search_path='' as $$
  select decoration = any(array[
    'original-night-gaze','original-signal-drift','original-midnight-bloom',
    'original-crimson-current','original-maple-scout','original-twilight-den',
    'original-amber-drift','original-woodland-lantern','original-moon-fox',
    'original-ribbon-bunny','original-ember-tiger','original-mint-raccoon'
  ]::text[]) or exists (
    select 1 from public.decoration_products dp join public.decoration_purchases p using(product_id)
    where dp.decoration_id=decoration and p.user_id=profile_ref
      and p.environment='Production' and p.status='active'
  );
$$;
revoke all on function private.owns_decoration(uuid,text) from public,anon,authenticated;
