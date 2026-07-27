alter table public.game_platforms
add column if not exists cover_url text;

comment on column public.game_platforms.cover_url is
  'URL de la jaquette spécifique à cette combinaison jeu, plateforme et région.';
