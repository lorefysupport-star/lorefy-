-- Align the deployed profiles table with the canonical account schema.
-- Older projects created genres as text[] while save_my_profile accepts jsonb.

alter table public.profiles
  alter column genres drop default;

alter table public.profiles
  alter column genres type jsonb
  using to_jsonb(genres);

alter table public.profiles
  alter column genres set default '[]'::jsonb;
