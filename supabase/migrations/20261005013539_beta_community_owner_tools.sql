-- Match the existing write-RPC boundary: no direct table write grants.
create or replace function public.mutate_community_post(
  post_ref uuid,
  post_body text default null,
  removed boolean default null
)
returns public.community_posts
language plpgsql volatile security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  uid uuid := auth.uid();
  current_post public.community_posts;
  row_out public.community_posts;
begin
  if uid is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  select * into current_post from public.community_posts
    where id = post_ref and user_id = uid for update;
  if not found then raise exception 'post_not_found' using errcode = 'P0002'; end if;
  if post_body is not null and (
    char_length(trim(post_body)) > 1000 or
    (trim(post_body) = '' and current_post.attachment = '{}'::jsonb)
  ) then raise exception 'invalid_post_body' using errcode = '22023'; end if;
  perform private.lock_actor_action('post');
  update public.community_posts
    set body = coalesce(trim(post_body), body),
        is_deleted = coalesce(removed, is_deleted),
        updated_at = timezone('utc', now())
    where id = post_ref and user_id = uid
    returning * into row_out;
  return row_out;
end;
$$;
revoke all on function public.mutate_community_post(uuid,text,boolean) from public, anon;
grant execute on function public.mutate_community_post(uuid,text,boolean) to authenticated;
