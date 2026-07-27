import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameHero, { type GameCoverOption } from "./GameHero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Region = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";

type Tag = {
  id: number;
  name: string;
};

type TagRelation = {
  tags: Tag | Tag[] | null;
};

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type GamePlatformRelation = {
  id: number;
  platform_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  edition_name: string | null;
  cover_url: string | null;
  platforms: Platform | Platform[] | null;
};

type ReleaseRelation = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  platforms: Platform | Platform[] | null;
};

type Game = {
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
  game_tags: TagRelation[] | null;
  game_platforms: GamePlatformRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

type CollectionEntry = {
  id: number;
  status: string | null;
  format: string | null;
  region: string | null;
  platforms: Platform | Platform[] | null;
};

type RelatedNews = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
};

type RelatedSeriesGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  release_year: number | null;
};

type InformationItem = {
  label: string;
  value: string;
};

type AvailabilityRow = {
  key: string;
  platformName: string;
  region: string | null;
  releaseDate: string | null;
  physical: boolean | null;
  digital: boolean | null;
  editionName: string | null;
  status: string | null;
};

const validRegions: Region[] = ["PAL", "US", "JAP", "ASIA", "WORLD"];

const gameModeLabels: Record<string, string> = {
  solo: "Solo",
  multiplayer: "Multijoueur",
  solo_multiplayer: "Solo et multijoueur",
  online: "Principalement en ligne",
};

const battleSystemLabels: Record<string, string> = {
  turn_based: "Tour par tour",
  active_time: "Temps actif / ATB",
  action: "Action en temps réel",
  tactical: "Tactique au tour par tour",
  real_time: "Temps réel",
  hybrid: "Hybride",
  other: "Autre système",
};

const partyStructureLabels: Record<string, string> = {
  fixed_party: "Groupe prédéfini",
  recruitable_party: "Personnages recrutables",
  customizable_party: "Groupe personnalisable",
  solo_character: "Personnage unique",
  rotating_party: "Groupe tournant",
  other: "Autre structure",
};

const progressionSystemLabels: Record<string, string> = {
  levels_equipment: "Niveaux et équipement",
  jobs: "Classes et métiers",
  skill_tree: "Arbres de compétences",
  crafting: "Artisanat et équipement",
  hybrid: "Système hybride",
  other: "Autre progression",
};

const narrativeStructureLabels: Record<string, string> = {
  linear: "Linéaire",
  branching: "À embranchements",
  episodic: "Épisodique",
  open: "Ouverte",
  other: "Autre structure",
};

const explorationStyleLabels: Record<string, string> = {
  world_map: "Carte du monde",
  zones: "Zones reliées",
  open_world: "Monde ouvert",
  hubs: "Hubs et missions",
  dungeon_crawler: "Donjons / dungeon crawler",
  other: "Autre exploration",
};

const difficultyLabels: Record<string, string> = {
  accessible: "Accessible",
  standard: "Standard",
  demanding: "Exigeante",
  customizable: "Personnalisable",
  other: "Variable",
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function isRegion(value: string | null): value is Region {
  return Boolean(value && validRegions.includes(value as Region));
}

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatReleaseFormat(
  physical: boolean | null,
  digital: boolean | null,
) {
  if (physical && digital) {
    return "Physique + numérique";
  }

  if (physical) {
    return "Physique";
  }

  if (digital) {
    return "Numérique";
  }

  return "—";
}

function formatStatus(status: string | null) {
  switch (status) {
    case "released":
      return "Sorti";
    case "confirmed":
      return "Confirmé";
    case "rumor":
      return "Rumeur";
    case "delayed":
      return "Repoussé";
    default:
      return null;
  }
}

function formatCollectionStatus(status: string | null) {
  switch (status) {
    case "owned":
      return "Possédé";
    case "playing":
      return "En cours";
    case "completed":
      return "Terminé";
    case "backlog":
      return "Backlog";
    case "wishlist":
      return "Wishlist";
    case "preordered":
      return "Précommandé";
    case "abandoned":
      return "Abandonné";
    default:
      return "Dans la collection";
  }
}

function formatCollectionFormat(format: string | null) {
  switch (format) {
    case "physical":
      return "Physique";
    case "digital":
      return "Numérique";
    case "both":
      return "Physique + numérique";
    default:
      return null;
  }
}

function getSummary(description: string | null) {
  if (!description) {
    return null;
  }

  const normalized = description.replace(/\s+/g, " ").trim();

  if (normalized.length <= 260) {
    return normalized;
  }

  return `${normalized.slice(0, 257).trimEnd()}…`;
}

function getNewsText(news: RelatedNews) {
  return news.excerpt ?? news.summary ?? "";
}

function labelValue(value: string | null, labels: Record<string, string>) {
  return value ? labels[value] ?? value : null;
}

function DetailsGrid({ items }: { items: InformationItem[] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="bg-slate-950/85 p-5">
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-2 text-base font-semibold leading-6 text-slate-100">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
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
        game_tags (
          tags (
            id,
            name
          )
        ),
        game_platforms (
          id,
          platform_id,
          region,
          release_date,
          physical,
          digital,
          edition_name,
          cover_url,
          platforms (
            id,
            name,
            manufacturer
          )
        ),
        game_releases (
          id,
          region,
          release_date,
          physical,
          digital,
          status,
          edition_name,
          platforms (
            id,
            name,
            manufacturer
          )
        )
      `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Impossible de charger la fiche du jeu :", error);
    throw new Error("Impossible de charger la fiche du jeu.");
  }

  if (!data) {
    notFound();
  }

  const game = data as unknown as Game;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowed = false;
  let collectionEntries: {
    id: number;
    status: string | null;
    format: string | null;
    region: string | null;
    platform: Platform | null;
  }[] = [];

  if (user) {
    const [{ data: followedGame }, { data: collectionData }] =
      await Promise.all([
        supabase
          .from("user_followed_games")
          .select("id")
          .eq("user_id", user.id)
          .eq("game_id", game.id)
          .maybeSingle(),
        supabase
          .from("user_collections")
          .select(
            `
              id,
              status,
              format,
              region,
              platforms (
                id,
                name,
                manufacturer
              )
            `,
          )
          .eq("user_id", user.id)
          .eq("game_id", game.id),
      ]);

    isFollowed = Boolean(followedGame);
    collectionEntries = ((collectionData ?? []) as unknown as CollectionEntry[])
      .map((item) => ({
        id: item.id,
        status: item.status,
        format: item.format,
        region: item.region,
        platform: normalizeRelation(item.platforms),
      }))
      .filter((item) => item.platform);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);

  const relatedNewsPromise = supabase
    .from("news")
    .select(
      `
        id,
        title,
        slug,
        summary,
        excerpt,
        image_url,
        category,
        published_at
      `,
    )
    .eq("related_game_id", game.id)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false })
    .limit(3);

  const sameSeriesPromise = game.series?.trim()
    ? supabase
        .from("games")
        .select("id, title, slug, cover_url, release_year")
        .eq("series", game.series)
        .neq("id", game.id)
        .order("release_year", { ascending: true })
        .limit(6)
    : Promise.resolve({ data: [] as RelatedSeriesGame[], error: null });

  const [{ data: relatedNewsData }, { data: sameSeriesData }] =
    await Promise.all([relatedNewsPromise, sameSeriesPromise]);

  const relatedNews = (relatedNewsData ?? []) as RelatedNews[];
  const sameSeriesGames = (sameSeriesData ?? []) as RelatedSeriesGame[];

  const tags =
    game.game_tags
      ?.map((relation) => normalizeRelation(relation.tags))
      .filter((tag): tag is Tag => Boolean(tag)) ?? [];

  const gamePlatforms =
    game.game_platforms
      ?.map((version) => ({
        ...version,
        platform: normalizeRelation(version.platforms),
      }))
      .filter((version) => version.platform) ?? [];

  const releases =
    game.game_releases
      ?.map((release) => ({
        ...release,
        platform: normalizeRelation(release.platforms),
      }))
      .filter((release) => release.platform) ?? [];

  const coverOptions: GameCoverOption[] = gamePlatforms
    .filter(
      (version) =>
        Boolean(version.cover_url) &&
        Boolean(version.platform) &&
        isRegion(version.region),
    )
    .map((version) => ({
      key: `${version.id}:${version.region}`,
      platformId: version.platform_id,
      platformName: version.platform?.name ?? "Plateforme",
      region: version.region as Region,
      coverUrl: version.cover_url as string,
    }))
    .sort((a, b) =>
      `${a.platformName}:${a.region}`.localeCompare(
        `${b.platformName}:${b.region}`,
        "fr",
      ),
    );

  const platformNames = Array.from(
    new Set(
      [
        ...gamePlatforms.map((version) => version.platform?.name),
        ...releases.map((release) => release.platform?.name),
      ].filter((name): name is string => Boolean(name)),
    ),
  );

  const firstReleaseDate =
    [
      ...gamePlatforms.map((version) => version.release_date),
      ...releases.map((release) => release.release_date),
    ]
      .filter((date): date is string => Boolean(date))
      .sort()[0] ?? null;

  const defaultCoverUrl = game.cover_url ?? coverOptions[0]?.coverUrl ?? null;

  const jrpgInformation: InformationItem[] = [
    game.original_title
      ? { label: "Titre original", value: game.original_title }
      : null,
    game.country_of_origin
      ? { label: "Origine", value: game.country_of_origin }
      : null,
    labelValue(game.game_mode, gameModeLabels)
      ? {
          label: "Mode de jeu",
          value: labelValue(game.game_mode, gameModeLabels) as string,
        }
      : null,
    game.main_story_hours
      ? {
          label: "Durée principale",
          value: `Environ ${game.main_story_hours} h`,
        }
      : null,
    game.available_languages
      ? { label: "Langues", value: game.available_languages }
      : null,
    labelValue(game.battle_system, battleSystemLabels)
      ? {
          label: "Système de combat",
          value: labelValue(game.battle_system, battleSystemLabels) as string,
        }
      : null,
    labelValue(game.party_structure, partyStructureLabels)
      ? {
          label: "Structure du groupe",
          value: labelValue(game.party_structure, partyStructureLabels) as string,
        }
      : null,
    labelValue(game.progression_system, progressionSystemLabels)
      ? {
          label: "Progression",
          value: labelValue(
            game.progression_system,
            progressionSystemLabels,
          ) as string,
        }
      : null,
    labelValue(game.narrative_structure, narrativeStructureLabels)
      ? {
          label: "Narration",
          value: labelValue(
            game.narrative_structure,
            narrativeStructureLabels,
          ) as string,
        }
      : null,
    labelValue(game.exploration_style, explorationStyleLabels)
      ? {
          label: "Exploration",
          value: labelValue(
            game.exploration_style,
            explorationStyleLabels,
          ) as string,
        }
      : null,
    labelValue(game.difficulty, difficultyLabels)
      ? {
          label: "Difficulté",
          value: labelValue(game.difficulty, difficultyLabels) as string,
        }
      : null,
  ].filter((item): item is InformationItem => Boolean(item?.value));

  const availabilityByKey = new Map<string, AvailabilityRow>();

  gamePlatforms.forEach((version) => {
    const platformName = version.platform?.name;

    if (!platformName) {
      return;
    }

    const key = `${platformName}:${version.region ?? ""}:${version.release_date ?? ""}:${version.edition_name ?? ""}`;

    availabilityByKey.set(key, {
      key: `platform-${version.id}`,
      platformName,
      region: version.region,
      releaseDate: version.release_date,
      physical: version.physical,
      digital: version.digital,
      editionName: version.edition_name,
      status: null,
    });
  });

  releases.forEach((release) => {
    const platformName = release.platform?.name;

    if (!platformName) {
      return;
    }

    const lookupKey = `${platformName}:${release.region ?? ""}:${release.release_date ?? ""}:${release.edition_name ?? ""}`;
    const existing = availabilityByKey.get(lookupKey);

    if (existing) {
      availabilityByKey.set(lookupKey, {
        ...existing,
        status: release.status,
      });
      return;
    }

    availabilityByKey.set(lookupKey, {
      key: `release-${release.id}`,
      platformName,
      region: release.region,
      releaseDate: release.release_date,
      physical: release.physical,
      digital: release.digital,
      editionName: release.edition_name,
      status: release.status,
    });
  });

  const availabilityRows = Array.from(availabilityByKey.values()).sort(
    (a, b) => {
      const dateA = a.releaseDate ?? "9999-12-31";
      const dateB = b.releaseDate ?? "9999-12-31";

      return (
        dateA.localeCompare(dateB) ||
        a.platformName.localeCompare(b.platformName, "fr")
      );
    },
  );

  const upcomingReleases = availabilityRows.filter(
    (row) =>
      Boolean(row.releaseDate) &&
      (row.releaseDate as string) >= today &&
      row.status !== "released",
  );

  const hasSidebar =
    collectionEntries.length > 0 || sameSeriesGames.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <GameHero
        gameId={game.id}
        title={game.title}
        series={game.series}
        description={getSummary(game.description)}
        developer={game.developer}
        publisher={game.publisher}
        releaseYear={game.release_year}
        firstReleaseDate={firstReleaseDate}
        defaultCoverUrl={defaultCoverUrl}
        coverOptions={coverOptions}
        tags={tags}
        platformNames={platformNames}
        initialIsFollowed={isFollowed}
      />

      <section
        className={`mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-8 ${
          hasSidebar
            ? "xl:grid-cols-[minmax(0,1fr)_340px]"
            : "max-w-5xl"
        }`}
      >
        <div className="grid content-start gap-8">
          {game.description && (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                Présentation
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                À propos de {game.title}
              </h2>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-300">
                {game.description}
              </p>
            </article>
          )}

          {upcomingReleases.length > 0 && (
            <section className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900/85 to-purple-950/25 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                    Calendrier
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Prochaines sorties
                  </h2>
                </div>
                <Link
                  href="/releases"
                  className="text-sm text-purple-300 hover:text-purple-200"
                >
                  Voir le calendrier →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {upcomingReleases.map((release) => (
                  <div
                    key={`upcoming-${release.key}`}
                    className="rounded-xl border border-slate-700 bg-slate-950/75 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">
                          {release.platformName}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {[
                            release.region,
                            formatReleaseFormat(
                              release.physical,
                              release.digital,
                            ),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {formatStatus(release.status) && (
                        <span className="rounded-full border border-purple-500/35 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                          {formatStatus(release.status)}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-lg font-bold text-white">
                      {formatDate(release.releaseDate)}
                    </p>
                    {release.editionName && (
                      <p className="mt-1 text-sm text-slate-400">
                        Édition {release.editionName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedNews.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                    Actualités
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    News liées à {game.title}
                  </h2>
                </div>
                <Link
                  href="/news"
                  className="text-sm text-purple-300 hover:text-purple-200"
                >
                  Toutes les news →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950/75 transition hover:border-purple-500"
                  >
                    <div className="relative aspect-video bg-slate-800">
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt={`Image de ${news.title}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-purple-300">
                          JRPG Vault
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-purple-300">
                        {news.category ?? "Actualité"}
                        {news.published_at
                          ? ` · ${formatDate(news.published_at)}`
                          : ""}
                      </p>
                      <h3 className="mt-2 line-clamp-2 font-bold text-white">
                        {news.title}
                      </h3>
                      {getNewsText(news) && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                          {getNewsText(news)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {jrpgInformation.length > 0 && (
            <section className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-slate-900/80 to-purple-950/25 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                Identité du jeu
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Profil JRPG
              </h2>
              <div className="mt-6">
                <DetailsGrid items={jrpgInformation} />
              </div>
            </section>
          )}

          {availabilityRows.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                    Disponibilité
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Versions disponibles
                  </h2>
                </div>
                <Link
                  href="/releases"
                  className="text-sm text-purple-300 hover:text-purple-200"
                >
                  Voir le calendrier →
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Plateforme</th>
                      <th className="px-4 py-3 font-semibold">Région</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Format</th>
                      <th className="px-4 py-3 font-semibold">Édition</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/65">
                    {availabilityRows.map((row) => (
                      <tr key={row.key}>
                        <td className="px-4 py-4 font-semibold text-white">
                          {row.platformName}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {row.region ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatShortDate(row.releaseDate)}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatReleaseFormat(row.physical, row.digital)}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {row.editionName || "Standard"}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {formatStatus(row.status) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {hasSidebar && (
          <aside className="grid content-start gap-6">
            {sameSeriesGames.length > 0 && (
              <section className="rounded-2xl border border-purple-500/25 bg-slate-900/65 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                  Même série
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Continuer la série {game.series}
                </h2>

                <div className="mt-5 grid gap-3">
                  {sameSeriesGames.map((relatedGame) => (
                    <Link
                      key={relatedGame.id}
                      href={`/games/${relatedGame.slug}`}
                      className="group grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/75 p-3 transition hover:border-purple-500"
                    >
                      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-slate-900">
                        {relatedGame.cover_url ? (
                          <img
                            src={relatedGame.cover_url}
                            alt={`Jaquette de ${relatedGame.title}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="px-2 text-center text-[10px] font-semibold text-purple-300">
                            JRPG Vault
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-semibold text-white transition group-hover:text-purple-200">
                          {relatedGame.title}
                        </h3>
                        {relatedGame.release_year && (
                          <p className="mt-1 text-sm text-slate-500">
                            {relatedGame.release_year}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {collectionEntries.length > 0 && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                  Mon Vault
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Dans ma collection
                </h2>

                <div className="mt-5 grid gap-3">
                  {collectionEntries.map((entry) => {
                    const collectionFormat = formatCollectionFormat(entry.format);

                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/75 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-white">
                            {entry.platform?.name ?? "Plateforme"}
                          </span>
                          <span className="text-sm font-bold text-purple-200">
                            {formatCollectionStatus(entry.status)}
                          </span>
                        </div>
                        {(collectionFormat || entry.region) && (
                          <p className="mt-3 text-sm text-slate-400">
                            {[collectionFormat, entry.region]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        )}
      </section>
    </main>
  );
}
