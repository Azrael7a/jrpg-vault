# Jaquettes par version

## Modèle

La jaquette principale reste référencée dans `games.cover_url`.

Chaque combinaison jeu, plateforme et région peut définir une jaquette spécifique dans `game_platforms.cover_url`.

Les fichiers sont envoyés depuis l’ordinateur de l’administrateur vers le bucket public Supabase Storage `game-covers`. Les colonnes `cover_url` conservent ensuite l’URL publique générée par Supabase.

## Formats acceptés

- JPEG ;
- PNG ;
- WebP ;
- taille maximale : 5 Mo par image.

## Sécurité

- les images sont publiques en lecture pour pouvoir apparaître dans le catalogue ;
- seuls les utilisateurs authentifiés reconnus comme administrateurs par `public.is_admin()` peuvent ajouter, modifier ou supprimer des fichiers dans le bucket.

## Comportement public

- la fiche affiche la jaquette de la version sélectionnée ;
- les boutons sont libellés avec la plateforme et la région ;
- si une version ne possède pas de jaquette, la jaquette principale est restaurée ;
- le choix de jaquette synchronise les champs plateforme et région de l’ajout à la collection.

## Déploiement

La migration `20260727120000_add_cover_url_to_game_platforms.sql` doit être appliquée à Supabase avant de déployer le code applicatif. Elle ajoute la colonne, crée le bucket et installe les politiques d’écriture réservées aux administrateurs.
