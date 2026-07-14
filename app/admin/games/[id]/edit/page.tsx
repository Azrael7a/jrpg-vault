import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogGameForm, {
  type CatalogGameValue,
  type CatalogPlatformValue,
} from "@/components/admin/CatalogGameForm";
import { updateCatalogGame } from "../../actions";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Platform = {
  id: number;
  name: string;
  is_legacy: boolean;
  display_order: number;
};

type PlatformRelation = {
  id: number;
  name: string;
};

type GamePlatformRelation = {
  id: number;
  region: "PAL" | "US" | "JAP" | "ASIA" | "WORLD";
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  edition_name: string | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type RawGame = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  series: string | null;
  cover_url: string | null;
  release_year: number | null;
  game_platforms: GamePlatformRelation[] | null;
};

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getFormat(gamePlatform: GamePlatformRelation) {
  if (gamePlatform.physical && gamePlatform.digital) {
    return "both" as const;
  }

  if (gamePlatform.digital) {
    return "digital" as const;
  }

  return "physical" as const;
}

export default async function EditCatalogGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const queryParams = await searchParams;
  const gameId = Number(id);

  if (!Number.isInteger(gameId) || gameId <= 0) {
    notFound();
  }

  const { supabase } = await requireAdmin();

  const [{ data: platformData, error: platformError }, { data, error }] =
    await Promise.all([
      supabase
        .from("platforms")
        .select("id, name, is_legacy, display_order")
        .order("is_legacy")
        .order("display_order")
        .order("name"),
      supabase
        .from("games")
        .select(
          `
            id,
            title,
            slug,
            description,
            developer,
            publisher,
            series,
            cover_url,
            release_year,
            game_platforms (
              id,
              region,
              release_date,
              physical,
              digital,
              edition_name,
              platforms (
                id,
                name
              )
            )
          `,
        )
        .eq("id", gameId)
        .single(),
    ]);

  if (error || !data) {
    notFound();
  }

  const game = data as RawGame;
  const platforms = (platformData ?? []) as Platform[];

  const initialGame: CatalogGameValue = {
    title: game.title,
    slug: game.slug,
    description: game.description ?? "",
    developer: game.developer ?? "",
    publisher: game.publisher ?? "",
    series: game.series ?? "",
    cover_url: game.cover_url ?? "",
    release_year: game.release_year ? String(game.release_year) : "",
  };

  const initialPlatforms: CatalogPlatformValue[] =
    game.game_platforms
      ?.map((gamePlatform) => {
        const platform = normalizeRelation(gamePlatform.platforms);

        if (!platform) {
          return null;
        }

        return {
          key: `game-platform-${gamePlatform.id}`,
          platform_id: platform.id,
          region: gamePlatform.region,
          release_date: gamePlatform.release_date ?? "",
          release_format: getFormat(gamePlatform),
          edition_name: gamePlatform.edition_name ?? "",
        };
      })
      .filter(
        (gamePlatform): gamePlatform is CatalogPlatformValue =>
          gamePlatform !== null,
      ) ?? [];

  const action = updateCatalogGame.bind(null, gameId);
  const errorMessage =
    typeof queryParams.error === "string" ? queryParams.error : null;

  return (
    <main className="mx-auto w-full max-w-6xl p-8">
      <Link href="/admin/games" className="text-sm text-violet-300 underline">
        ← Retour au catalogue administratif
      </Link>

      <div className="mt-6">
        <p className="jrpg-badge">Administration</p>
        <h1 className="mt-4 text-4xl font-bold">Modifier {game.title}</h1>
        <p className="mt-3 text-slate-400">
          Modifie la fiche et les versions proposées dans la collection.
        </p>
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {errorMessage}
        </p>
      )}

      {platformError && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          Impossible de charger les plateformes : {platformError.message}
        </p>
      )}

      <CatalogGameForm
        action={action}
        platforms={platforms}
        submitLabel="Enregistrer les modifications"
        initialGame={initialGame}
        initialPlatforms={initialPlatforms}
      />
    </main>
  );
}
