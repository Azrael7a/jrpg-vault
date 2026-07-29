# Jaquettes par version

## Modèle

La jaquette utilisée par défaut dans le catalogue reste référencée dans `games.cover_url`.

Chaque combinaison jeu, plateforme et région peut définir une jaquette spécifique dans `game_platforms.cover_url`.

Une jaquette de version peut être désignée comme jaquette par défaut : son URL est alors copiée dans `games.cover_url`. Le catalogue, la page d’accueil et l’ouverture de la fiche utilisent donc toujours la même image par défaut.

Les fichiers sont envoyés depuis l’ordinateur de l’administrateur vers le bucket public Supabase Storage `game-covers`. Les colonnes `cover_url` conservent ensuite l’URL publique générée par Supabase.

## Formats acceptés

- JPEG ;
- PNG ;
- WebP ;
- taille maximale : 5 Mo par image.

## Sécurité

- les images sont publiques en lecture pour pouvoir apparaître dans le catalogue ;
- seuls les utilisateurs authentifiés reconnus comme administrateurs par `public.is_admin()` peuvent ajouter, modifier ou supprimer des fichiers dans le bucket.

## Administration

- la zone « Jaquette par défaut du catalogue » montre l’image actuellement utilisée dans les listes ;
- chaque version possédant une image propose « Utiliser par défaut dans le catalogue » ;
- la version choisie reçoit un badge « Visible dans le catalogue » ;
- remplacer ou retirer une jaquette de version met aussi à jour la jaquette par défaut lorsque cette version était sélectionnée.

## Comportement public

- la fiche s’ouvre sur la jaquette par défaut du catalogue ;
- aucune miniature n’est affichée dans les boutons de sélection ;
- les boutons texte sont libellés avec la plateforme et la région, par exemple `PlayStation · PAL` ;
- cliquer sur un bouton remplace la grande jaquette affichée ;
- le bouton « Jaquette par défaut » restaure l’image du catalogue ;
- le choix d’une jaquette de version synchronise les champs plateforme et région de l’ajout à la collection.

## Déploiement

La migration `20260727120000_add_cover_url_to_game_platforms.sql` doit être appliquée à Supabase avant de déployer le code applicatif. Elle ajoute la colonne, crée le bucket et installe les politiques d’écriture réservées aux administrateurs.
