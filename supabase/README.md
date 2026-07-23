# Schéma Supabase de JRPG Vault

Ce dossier doit permettre de recréer la structure de la base sans dépendre du Dashboard Supabase.

## Fichiers à versionner

- `config.toml`
- `migrations/*.sql`
- `seed.sql` si des données de démonstration non sensibles sont ajoutées
- les tests SQL éventuels

Les dossiers `.temp/` et `.branches/` sont internes au CLI et ne doivent pas être versionnés.

## Première synchronisation avec le projet distant

Depuis la racine du dépôt :

```bash
supabase login
supabase link --project-ref rvkfkrmlkhqqyszvyqit
supabase migration list --linked
```

Avant de générer une migration, contrôler la sortie de `migration list`. Le dépôt contient déjà une migration liée à `game_platforms`; son état local et distant doit être compris avant toute réparation de l'historique.

Pour obtenir un instantané SQL non destructif du schéma public :

```bash
supabase db dump --linked --schema public --file supabase/schema.snapshot.sql
```

Cet instantané sert uniquement à la revue. Une fois la migration de référence validée, il ne doit pas être conservé en doublon si tout son contenu est déjà présent dans `migrations/`.

La migration de référence sera générée avec `supabase db pull` après vérification de l'historique :

```bash
supabase db pull baseline --linked
```

Le fichier produit doit être relu avant commit, notamment pour vérifier :

- les tables, contraintes, index et clés étrangères ;
- les fonctions PostgreSQL, dont `is_admin()` ;
- l'activation de RLS ;
- toutes les policies ;
- les triggers ;
- l'absence de données, secrets ou informations personnelles ;
- l'absence de suppressions inattendues d'extensions.

## Validation locale

Une fois le schéma capturé :

```bash
supabase db reset
supabase db lint --local
supabase migration list --linked
```

`supabase db reset` sans `--linked` ne touche que la base locale.

## Commandes interdites sur le projet de production sans revue

Ne pas exécuter :

```bash
supabase db reset --linked
supabase db push
supabase migration repair ...
```

Ces commandes peuvent modifier l'état distant ou son historique. Toujours examiner un `db push --dry-run` avant un éventuel déploiement de migration.
