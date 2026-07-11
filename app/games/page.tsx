import { createClient } from "@/utils/supabase/server";
import GamesList from "./GamesList";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type TagRelation = {
  tags:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type ReleaseRelation = {
  id: number;
  release_date: string | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type RawGame = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  game_tags: TagRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

type CollectionRow = {
  game_id: number | null;
  status: CollectionStatus;
};

function normalizeArray<T>(relation: T | T[] | null): T[] {
  if (!relation) {
    return [];
  }

  return Array.isArray(relation) ? relation : [relation];
}

export default async function GamesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      slug,
      series,
      release_year,
      cover_url,
      developer,
      publisher,
      game_tags (
        tags (
          id,
          name
        )
      ),
      game_releases (
        id,
        release_date,
        platforms (
          id,
          name,
          manufacturer
        )
      )
    `
    )
    .order("title");

  if (error) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <h1 className="text-3xl font-bold">Catalogue JRPG</h1>
        <p className="mt-4 text-red-400">Erreur : {error.message}</p>
      </main>
    );
  }

  let collectionRows: CollectionRow[] = [];

  if (user) {
    const { data: collectionData } = await supabase
      .from("user_collections")
      .select("game_id, status")
      .eq("user_id", user.id);

    collectionRows = (collectionData ?? []) as CollectionRow[];
  }

  const collectionStatusesByGameId = collectionRows.reduce<
    Record<number, CollectionStatus[]>
  >((acc, item) => {
    if (!item.game_id) {
      return acc;
    }

    acc[item.game_id] = [...(acc[item.game_id] ?? []), item.status];
    return acc;
  }, {});

  const games = ((data ?? []) as RawGame[]).map((game) => {
    const tags =
      game.game_tags
        ?.flatMap((relation) => normalizeArray(relation.tags))
        .filter((tag): tag is { id: number; name: string } => Boolean(tag)) ??
      [];

    const platformMap = new Map<number, PlatformRelation>();

    game.game_releases?.forEach((release) => {
      normalizeArray(release.platforms).forEach((platform) => {
        platformMap.set(platform.id, platform);
      });
    });

    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      series: game.series,
      release_year: game.release_year,
      cover_url: game.cover_url,
      developer: game.developer,
      publisher: game.publisher,
      tags,
      platforms: Array.from(platformMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      collection_statuses: collectionStatusesByGameId[game.id] ?? [],
    };
  });

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="max-w-3xl">
        <p className="jrpg-badge">Catalogue</p>

        <h1 className="mt-4 text-4xl font-bold">Catalogue JRPG</h1>

        <p className="mt-3 text-slate-400">
          Recherche un jeu, filtre par plateforme, genre ou statut de collection,
          puis trouve rapidement le prochain JRPG à ajouter à ton Vault.
        </p>
      </div>

      <GamesList games={games} />
    </main>
  );
}
