-- Bound reaction mutations per authenticated actor to protect the community API.

create table if not exists private.actor_hourly_quotas (
  actor_id uuid not null references auth.users(id) on delete cascade,
  action_name text not null,
  window_start timestamptz not null,
  action_count integer not null default 0,
  primary key (actor_id, action_name, window_start),
  check (action_count >= 0)
);
revoke all on table private.actor_hourly_quotas from public, anon, authenticated;

create or replace function private.consume_reaction_quota()
returns void
language plpgsql volatile security definer
set search_path = pg_catalog, private
as $$
declare
  uid uuid := auth.uid();
  bucket timestamptz := date_trunc('hour', timezone('utc', now()));
  current_count integer;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  perform private.lock_actor_action('reaction');
  insert into private.actor_hourly_quotas(actor_id, action_name, window_start, action_count)
  values(uid, 'reaction', bucket, 1)
  on conflict(actor_id, action_name, window_start) do update
  set action_count = private.actor_hourly_quotas.action_count + 1
  returning action_count into current_count;
  if current_count > 240 then raise exception 'reaction_rate_limit' using errcode='P0001'; end if;
end;
$$;
revoke all on function private.consume_reaction_quota() from public, anon;
grant execute on function private.consume_reaction_quota() to authenticated;

create or replace function public.set_review_reaction(review_ref uuid, reaction_kind text, reaction_active boolean default true)
returns boolean language plpgsql security definer set search_path=public,private,pg_temp
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if reaction_kind not in ('like','dislike','heart') then raise exception 'invalid_reaction' using errcode='22023'; end if;
  if not private.can_interact_with_review(review_ref) then raise exception 'review_not_found' using errcode='P0002'; end if;
  perform private.consume_reaction_quota();
  if reaction_active then
    insert into public.review_reactions(review_id,user_id,kind)
    values(review_ref,uid,reaction_kind) on conflict do nothing;
  else
    delete from public.review_reactions
    where review_id=review_ref and user_id=uid and kind=reaction_kind;
  end if;
  return reaction_active;
end;
$$;
revoke all on function public.set_review_reaction(uuid,text,boolean) from public,anon;
grant execute on function public.set_review_reaction(uuid,text,boolean) to authenticated;
