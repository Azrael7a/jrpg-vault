alter table public.games
  add column if not exists original_title text,
  add column if not exists country_of_origin text,
  add column if not exists game_mode text,
  add column if not exists battle_system text,
  add column if not exists party_structure text,
  add column if not exists progression_system text,
  add column if not exists narrative_structure text,
  add column if not exists exploration_style text,
  add column if not exists difficulty text,
  add column if not exists main_story_hours integer,
  add column if not exists available_languages text;

alter table public.games
  drop constraint if exists games_main_story_hours_check;

alter table public.games
  add constraint games_main_story_hours_check
  check (
    main_story_hours is null
    or (main_story_hours >= 1 and main_story_hours <= 999)
  );

comment on column public.games.original_title is
  'Titre original du jeu lorsqu’il diffère du titre affiché.';
comment on column public.games.country_of_origin is
  'Pays ou territoire d’origine du développement.';
comment on column public.games.game_mode is
  'Mode de jeu principal normalisé.';
comment on column public.games.battle_system is
  'Type de système de combat JRPG normalisé.';
comment on column public.games.party_structure is
  'Structure du groupe jouable normalisée.';
comment on column public.games.progression_system is
  'Structure de progression principale normalisée.';
comment on column public.games.narrative_structure is
  'Structure narrative principale normalisée.';
comment on column public.games.exploration_style is
  'Structure d’exploration principale normalisée.';
comment on column public.games.difficulty is
  'Niveau ou gestion générale de la difficulté.';
comment on column public.games.main_story_hours is
  'Durée indicative de l’histoire principale en heures.';
comment on column public.games.available_languages is
  'Langues et sous-titres disponibles, sous forme de texte éditorial.';
