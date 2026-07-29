import Link from "next/link";
import { notFound } from "next/navigation";
import CatalogGameUploadForm, {
  type CatalogGameValue,
  type CatalogPlatformValue,
} from "@/components/admin/CatalogGameUploadForm";
import GameJrpgMetadataForm, {
  type GameJrpgMetadataValue,
} from "@/components/admin/GameJrpgMetadataForm";
import { updateCatalogGame } from "../../actions";
import { updateGameJrpgMetadata } from "../../jrpg-actions";
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
  cover_url: string | null;
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
  original_title: string | null;
  country_of_origin: string | null;
  game_mode: string | null;
  battle_system: string | null;
  party_structure: string | null;
  progression_system: string | null;
  narrative_structure: string | null;
  exploration_style: string | null;
  difficulty: string | null;
  main_story_hours: number | null;
  available_languages: string | null;
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
            original_title,
            country_of_origin,
            game_mode,
            battle_system,
            party_structure,
            progression_system,
            narrative_structure,
            exploration_style,
            difficulty,
            main_story_hours,
            available_languages,
            game_platforms (
              id,
              region,
              release_date,
              physical,
              digital,
              edition_name,
              cover_url,
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

  const initialJrpgMetadata: GameJrpgMetadataValue = {
    original_title: game.original_title ?? "",
    country_of_origin: game.country_of_origin ?? "",
    game_mode: game.game_mode ?? "",
    battle_system: game.battle_system ?? "",
    party_structure: game.party_structure ?? "",
    progression_system: game.progression_system ?? "",
    narrative_structure: game.narrative_structure ?? "",
    exploration_style: game.exploration_style ?? "",
    difficulty: game.difficulty ?? "",
    main_story_hours: game.main_story_hours
      ? String(game.main_story_hours)
      : "",
    available_languages: game.available_languages ?? "",
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
          cover_url: gamePlatform.cover_url ?? "",
        };
      })
      .filter(
        (gamePlatform): gamePlatform is CatalogPlatformValue =>
          gamePlatform !== null,
      ) ?? [];

  const catalogAction = updateCatalogGame.bind(null, gameId);
  const jrpgAction = updateGameJrpgMetadata.bind(null, gameId);
  const errorMessage =
    typeof queryParams.error === "string" ? queryParams.error : null;
  const jrpgError =
    typeof queryParams.jrpg_error === "string"
      ? queryParams.jrpg_error
      : null;
  const jrpgUpdated = queryParams.jrpg_updated === "1";

  return (
    <main className="mx-auto w-full max-w-6xl p-8">
      <Link href="/admin/games" className="text-sm text-violet-300 underline">
        ← Retour au catalogue administratif
      </Link>

      <div className="mt-6">
        <p className="jrpg-badge">Administration</p>
        <h1 className="mt-4 text-4xl font-bold">Modifier {game.title}</h1>
        <p className="mt-3 text-slate-400">
          Modifie les informations générales, les versions, les jaquettes et le
          profil JRPG affiché sur la fiche publique.
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

      <CatalogGameUploadForm
        action={catalogAction}
        platforms={platforms}
        submitLabel="Enregistrer les modifications"
        initialGame={initialGame}
        initialPlatforms={initialPlatforms}
      />

      {jrpgError && (
        <p className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {jrpgError}
        </p>
      )}

      {jrpgUpdated && (
        <p className="mt-8 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
          Les informations JRPG ont été enregistrées.
        </p>
      )}

      <GameJrpgMetadataForm
        action={jrpgAction}
        initialValue={initialJrpgMetadata}
      />
    </main>
  );
}
