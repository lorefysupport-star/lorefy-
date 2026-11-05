-- Extend only the installed free frame/page projection; preserve its authorization.
do $migration$
declare
  definition text;
  old_case text := $old$or private.owns_decoration(profile_ref,s.decoration->>item.key)$old$;
  new_case text := $new$or (item.key in ('frame','page') and s.decoration->>item.key in (
    'crafted-witch','crafted-moon','crafted-ink','crafted-theatre',
    'crafted-dawn','crafted-dusk','crafted-garden','crafted-patchwork'))
        or private.owns_decoration(profile_ref,s.decoration->>item.key)$new$;
begin
  definition := pg_get_functiondef('public.get_public_profile_artwork(uuid)'::regprocedure);
  if strpos(definition,new_case)>0 then return; end if;
  if strpos(definition,old_case)=0
    or strpos(definition,'auth.uid() is not null')=0
    or strpos(definition,'private.author_has_blocked_viewer')=0
    or strpos(definition,'private.reader_has_blocked_author')=0
    or strpos(definition,$guard$s.decoration->>'ownerId' = profile_ref::text$guard$)=0 then
    raise exception 'Artwork projection changed; review before enabling crafted frames';
  end if;
  execute replace(definition,old_case,new_case);
end;
$migration$;
