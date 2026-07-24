import { createClient } from "@/lib/supabase/server";
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
  slug: string;
  manufacturer: string | null;
  generation: number | null;
  is_legacy: boolean;
  display_order: number;
};

type GamePlatformRelation = {
  id: number;
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
  game_platforms: GamePlatformRelation[] | null;
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

function comparePlatforms(a: PlatformRelation, b: PlatformRelation) {
  if (a.is_legacy !== b.is_legacy) {
    return Number(a.is_legacy) - Number(b.is_legacy);
  }

  if (a.display_order !== b.display_order) {
    return a.display_order - b.display_order;
  }

  return a.name.localeCompare(b.name, "fr");
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
      game_platforms (
        id,
        platforms (
          id,
          name,
          slug,
          manufacturer,
          generation,
          is_legacy,
          display_order
        )
      )
    `,
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

    game.game_platforms?.forEach((gamePlatform) => {
      normalizeArray(gamePlatform.platforms).forEach((platform) => {
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
      platforms: Array.from(platformMap.values()).sort(comparePlatforms),
      collection_statuses: collectionStatusesByGameId[game.id] ?? [],
    };
  });

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="max-w-3xl">
        <p className="jrpg-badge">Catalogue</p>

        <h1 className="mt-4 text-4xl font-bold">Catalogue JRPG</h1>

        <p className="mt-3 text-slate-400">
          Recherche un jeu, filtre les supports actuels ou rétro, puis trouve
          rapidement le prochain JRPG à ajouter à ton Vault.
        </p>
      </div>

      <GamesList games={games} />
    </main>
  );
}
