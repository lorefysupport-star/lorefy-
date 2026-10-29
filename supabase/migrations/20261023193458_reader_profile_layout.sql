-- Extend only the layout whitelist in the installed artwork projection.
-- Existing ownership, block/privacy checks and decoration licensing stay intact.
do $migration$
declare
  definition text;
  old_case text := $old$case when s.profile_layout = '"immersive"'::jsonb then 'immersive' else 'normal' end$old$;
  new_case text := $new$case when s.profile_layout = '"reader"'::jsonb then 'reader' when s.profile_layout = '"immersive"'::jsonb then 'immersive' else 'normal' end$new$;
begin
  definition := pg_get_functiondef('public.get_public_profile_artwork(uuid)'::regprocedure);
  if strpos(definition,new_case)>0 then return; end if;
  if strpos(definition,old_case)=0 then
    raise exception 'Artwork layout whitelist changed; review before applying reader layout';
  end if;
  execute replace(definition,old_case,new_case);
end;
$migration$;
