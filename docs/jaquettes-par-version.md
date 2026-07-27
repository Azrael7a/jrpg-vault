# Jaquettes par version

## Modèle

La jaquette principale reste stockée dans `games.cover_url`.

Chaque combinaison jeu, plateforme et région peut définir une jaquette spécifique dans `game_platforms.cover_url`.

## Comportement public

- la fiche affiche la jaquette de la version sélectionnée ;
- les boutons sont libellés avec la plateforme et la région ;
- si une version ne possède pas de jaquette, la jaquette principale est restaurée ;
- le choix de jaquette synchronise les champs plateforme et région de l’ajout à la collection.

## Déploiement

La migration `20260727120000_add_cover_url_to_game_platforms.sql` doit être appliquée à Supabase avant de déployer le code applicatif.
