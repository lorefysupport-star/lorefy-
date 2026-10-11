-- Narrow, additive purchase ledger. Never rewrite historical account state.
create table public.decoration_products (
  product_id text primary key,
  decoration_id text not null unique,
  price_minor integer not null check (price_minor=1300),
  currency text not null check (currency='SAR')
);
create table public.decoration_purchases (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.decoration_products(product_id),
  environment text not null check (environment in ('Production','Sandbox')),
  status text not null check (status in ('active','revoked')),
  transaction_id text not null,
  original_transaction_id text not null,
  purchased_at timestamptz not null,
  verified_at timestamptz not null default now(),
  primary key (environment,original_transaction_id)
);
create index decoration_purchase_owner_idx on public.decoration_purchases(user_id,product_id,environment,status);
alter table public.decoration_products enable row level security;
alter table public.decoration_purchases enable row level security;
revoke all on public.decoration_products,public.decoration_purchases from anon,authenticated;
grant select on public.decoration_products,public.decoration_purchases to authenticated;
grant all on public.decoration_products,public.decoration_purchases to service_role;
create policy "Authenticated product catalog" on public.decoration_products for select to authenticated using (true);
create policy "Owner purchase history" on public.decoration_purchases for select to authenticated using ((select auth.uid())=user_id);

insert into public.decoration_products(product_id,decoration_id,price_minor,currency)
select 'com.lorefy.app.decorations.'||replace(id,'-','_'),'original-'||id,1300,'SAR'
from unnest(array['night-gaze','signal-drift','midnight-bloom','crimson-current','maple-scout','twilight-den','amber-drift','woodland-lantern','moon-fox','ribbon-bunny','ember-tiger','mint-raccoon']) ids(id);

create function public.record_decoration_purchase(purchase jsonb)
returns text language plpgsql security definer set search_path='' as $$
declare result text;
begin
  -- Unique original_transaction_id binds a receipt to one Lorefy account.
  insert into public.decoration_purchases(user_id,product_id,environment,status,transaction_id,original_transaction_id,purchased_at,verified_at)
  values ((purchase->>'user_id')::uuid,purchase->>'product_id',purchase->>'environment',purchase->>'status',purchase->>'transaction_id',purchase->>'original_transaction_id',(purchase->>'purchased_at')::timestamptz,now())
  on conflict (environment,original_transaction_id) do update set
    status=case when decoration_purchases.status='revoked' or excluded.status='revoked' then 'revoked' else 'active' end,
    verified_at=now()
  where decoration_purchases.user_id=excluded.user_id and decoration_purchases.product_id=excluded.product_id
  returning status into result;
  if result is null then raise exception 'Receipt belongs to another account'; end if;
  return result;
end; $$;
revoke all on function public.record_decoration_purchase(jsonb) from public,anon,authenticated;
grant execute on function public.record_decoration_purchase(jsonb) to service_role;

create function private.owns_decoration(profile_ref uuid,decoration text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.decoration_products dp join public.decoration_purchases p using(product_id)
    where dp.decoration_id=decoration and p.user_id=profile_ref and p.environment='Production' and p.status='active');
$$;
revoke all on function private.owns_decoration(uuid,text) from public,anon,authenticated;

create function private.guard_paid_decorations()
returns trigger language plpgsql security definer set search_path='' as $$
declare decoration jsonb; chosen text; component text; previous jsonb;
begin
  decoration=private.reader_state_json(new.data->>'lorefy.user.profileDecoration.v1','{}');
  if tg_op='UPDATE' then previous=private.reader_state_json(old.data->>'lorefy.user.profileDecoration.v1','{}'); end if;
  foreach component in array array['frame','page','effect'] loop
    chosen=decoration->>component;
    if exists(select 1 from public.decoration_products where decoration_id=chosen)
      and not private.owns_decoration(new.user_id,chosen) then
      if previous->>component=chosen then
        -- A refunded existing decoration cannot block unrelated reading-state sync.
        decoration=jsonb_set(decoration,array[component],'null'::jsonb);
        new.data=jsonb_set(new.data,array['lorefy.user.profileDecoration.v1'],to_jsonb(decoration::text));
      else
        raise exception 'Verified decoration purchase required' using errcode='42501';
      end if;
    end if;
  end loop;
  return new;
end; $$;
revoke all on function private.guard_paid_decorations() from public,anon,authenticated;
create trigger guard_paid_decorations before insert or update of data on public.user_state
for each row execute function private.guard_paid_decorations();

CREATE OR REPLACE FUNCTION public.get_public_profile_artwork(profile_ref uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
  with snapshot as (
    select private.reader_state_json(us.data->>'lorefy.user.customCovers.v2','{}') covers,
      private.reader_state_json(us.data->>'lorefy.characterCustomImages.v1','{}') portraits,
      private.reader_state_json(us.data->>'lorefy.user.favorites.v2','[]') favorites,
      private.reader_state_json(us.data->>'lorefy.user.library.v2','{}') library,
      private.reader_state_json(us.data->>'lorefy.user.profileTopCharacters.v1','[]') characters,
      private.reader_state_json(us.data->>'lorefy.user.profileLayout.v1','"normal"') profile_layout,
      private.reader_state_json(us.data->>'lorefy.user.profileDecoration.v1','{}') decoration
    from public.profiles p left join public.user_state us on us.user_id=p.id
    where auth.uid() is not null and p.id=profile_ref
      and (p.id=auth.uid() or (not p.is_private
        and not private.author_has_blocked_viewer(p.id)
        and not private.reader_has_blocked_author(p.id)))
  )
  select jsonb_build_object(
    'profile_layout', case when s.profile_layout = '"immersive"'::jsonb then 'immersive' else 'normal' end,
    'profile_decoration', case when s.decoration->>'ownerId' = profile_ref::text then
      (select jsonb_object_agg(item.key,case when s.decoration->>item.key in ('observatory','blossom','manuscript','pfpvibes-maple-drift','pfpvibes-robins-perch','pfpvibes-mushroom-grove','pfpvibes-grasping-hands','pfpvibes-ghost-orbit','pfpvibes-watching-eyes','pfpvibes-prism-spin','pfpvibes-ripple-pulse','pfpvibes-neon-orbit','pfpvibes-pearl-bubbles','pfpvibes-scale-shimmer','pfpvibes-coral-crown','pfpvibes-block-party','pfpvibes-rocket-ride','pfpvibes-gumball-ring','pfpvibes-goal-rush','pfpvibes-stadium-lights','pfpvibes-champion-laurel','pfpvibes-peekaboo-pal','pfpvibes-bunny-hug','pfpvibes-kitty-crew','pfpvibes-moth-lantern','pfpvibes-rune-circle','pfpvibes-thorn-rose')
        or private.owns_decoration(profile_ref,s.decoration->>item.key)
        then s.decoration->item.key else 'null'::jsonb end) from unnest(array['frame','page','effect']) item(key))
      else jsonb_build_object('frame',null,'page',null,'effect',null) end,
    'custom_work_covers', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.covers)='object' then s.covers else '{}' end) c
      where jsonb_typeof(c.value)='string' and
        ((case when jsonb_typeof(s.favorites)='array' then s.favorites else '[]' end) ? c.key
         or (case when jsonb_typeof(s.library)='object' then s.library else '{}' end) ? c.key)), '{}'),
    'custom_character_images', coalesce((select jsonb_object_agg(c.key,c.value)
      from jsonb_each(case when jsonb_typeof(s.portraits)='object' then s.portraits else '{}' end) c
      where jsonb_typeof(c.value)='string' and exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(s.characters)='array' then s.characters else '[]' end) r
        where c.key in (r->'character'->>'id',r->'character'->>'key',r->>'id',r->>'key',r->>'characterKey',
          regexp_replace(regexp_replace(lower(trim(coalesce(r->'character'->>'latin',r->'character'->>'name',r->>'latin',r->>'name',''))),'\s+','-','g'),'[^a-z0-9_ء-ي-]','','g')))), '{}'))
  from snapshot s;
$function$
