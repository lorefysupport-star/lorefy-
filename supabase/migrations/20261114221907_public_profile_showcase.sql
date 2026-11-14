-- Add one presentation mode without replacing access checks or execute grants.
do $migration$
declare
  definition text;
  old_case text := $old$library_view in ('spines','shelf')$old$;
  new_case text := $new$library_view in ('spines','shelf','showcase')$new$;
begin
  definition := pg_get_functiondef('public.get_public_profile_appearance(uuid)'::regprocedure);
  if strpos(definition,'auth.uid() is not null')=0
    or strpos(definition,'p.id=auth.uid()')=0
    or strpos(definition,'not p.is_private')=0
    or strpos(definition,'private.author_has_blocked_viewer')=0
    or strpos(definition,'private.reader_has_blocked_author')=0 then
    raise exception 'Appearance projection changed; review before enabling showcase';
  end if;
  if strpos(definition,new_case)>0 then return; end if;
  if strpos(definition,old_case)=0 then
    raise exception 'Appearance projection changed; review before enabling showcase';
  end if;
  execute replace(definition,old_case,new_case);
end;
$migration$;
