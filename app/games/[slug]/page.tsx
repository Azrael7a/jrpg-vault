import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddToCollectionButton from "./AddToCollectionButton";
import FollowGameButton from "./FollowGameButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CoverRegion = "PAL" | "US" | "JAP";

type SearchParams = {
  cover?: string | string[];
};

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
  slug: string | null;
  is_legacy: boolean | null;
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

type GamePlatformRelation = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
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
  french_audio: boolean | null;
  french_subtitles: boolean | null;
  game_tags: TagRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

type GameCover = {
  id: number;
  region: CoverRegion;
  cover_url: string;
  is_default: boolean | null;
};

type CollectionEntry = {
  id: number;
  status: string | null;
  format: string | null;
  region: string | null;
  platforms: Platform | Platform[] | null;
};

type NormalizedCollectionEntry = {
  id: number;
  status: string | null;
  format: string | null;
  region: string | null;
  platform: Platform;
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

type RelatedGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  release_year: number | null;
};

type NormalizedVersion = {
  id: string;
  source: "release" | "platform";
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  platform: Platform;
};

const COVER_REGIONS: CoverRegion[] = ["PAL", "US", "JAP"];

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeCoverRegion(value: string | string[] | undefined) {
  const region = getStringParam(value)?.toUpperCase();

  if (region === "PAL" || region === "US" || region === "JAP") {
    return region;
  }

  return null;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDate);
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
      return "Référencé";
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "released":
      return "border-slate-600 bg-slate-800 text-slate-200";
    case "confirmed":
      return "border-green-500/40 bg-green-950/70 text-green-200";
    case "rumor":
      return "border-yellow-500/40 bg-yellow-950/70 text-yellow-200";
    case "delayed":
      return "border-orange-500/40 bg-orange-950/70 text-orange-200";
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
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
      return "Statut inconnu";
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
      return "Format inconnu";
  }
}

function formatReleaseFormat(physical: boolean | null, digital: boolean | null) {
  if (physical && digital) {
    return "Physique + numérique";
  }

  if (physical) {
    return "Physique";
  }

  if (digital) {
    return "Numérique";
  }

  return "Format inconnu";
}

function formatBooleanInfo(value: boolean | null) {
  if (value === true) {
    return "Oui";
  }

  if (value === false) {
    return "Non";
  }

  return "Inconnu";
}

function normalizePlatformName(name: string | null | undefined) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPlayStationPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug.includes("playstation") ||
    normalizedSlug.includes("ps") ||
    normalizedName.includes("playstation") ||
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5")
  );
}

function isSwitchPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug.includes("switch") ||
    normalizedName === "switch" ||
    normalizedName.includes("nintendo switch") ||
    normalizedName.includes("switch 2") ||
    normalizedName.includes("switch2")
  );
}

function isXboxPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return normalizedName.includes("xbox") || normalizedSlug.includes("xbox");
}

function isPcPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "pc" ||
    normalizedSlug.includes("windows") ||
    normalizedSlug.includes("steam") ||
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  );
}

function getPlatformTagClass(platform: Platform) {
  if (isSwitchPlatform(platform)) {
    return "border-red-500 bg-red-600 text-white";
  }

  if (isPlayStationPlatform(platform)) {
    return "border-sky-500 bg-sky-600 text-white";
  }

  if (isXboxPlatform(platform)) {
    return "border-green-500 bg-green-600 text-white";
  }

  if (isPcPlatform(platform)) {
    return "border-purple-500 bg-purple-600 text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getNewsText(news: RelatedNews) {
  return news.excerpt ?? news.summary ?? "Aucun résumé disponible.";
}

function getCategoryLabel(category: string | null) {
  return category ?? "Actualité";
}

function getFirstReleaseLabel(
  versions: NormalizedVersion[],
  releaseYear: number | null,
) {
  const firstDatedVersion = versions.find((version) => version.release_date);

  if (firstDatedVersion?.release_date) {
    return formatDate(firstDatedVersion.release_date);
  }

  if (releaseYear) {
    return String(releaseYear);
  }

  return "Inconnue";
}

function getQualityIssues({
  game,
  versions,
  covers,
}: {
  game: Game;
  versions: NormalizedVersion[];
  covers: GameCover[];
}) {
  const issues: string[] = [];

  if (!game.description?.trim()) {
    issues.push("Sans description");
  }

  if (!game.cover_url && covers.length === 0) {
    issues.push("Sans jaquette");
  }

  if (versions.length === 0) {
    issues.push("Sans plateforme");
  }

  if (game.french_audio === null || game.french_subtitles === null) {
    issues.push("Sans infos langue");
  }

  if (covers.length === 0) {
    issues.push("Sans jaquettes régionales");
  }

  return issues;
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedCoverRegion = normalizeCoverRegion(resolvedSearchParams.cover);

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
      french_audio,
      french_subtitles,
      game_tags (
        tags (
          id,
          name
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
          manufacturer,
          slug,
          is_legacy
        )
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const game = data as unknown as Game;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let isFollowed = false;
  let collectionEntries: NormalizedCollectionEntry[] = [];

  const [
    coversResult,
    gamePlatformsResult,
    relatedNewsResult,
    relatedGamesResult,
  ] = await Promise.all([
    supabase
      .from("game_covers")
      .select(
        `
        id,
        region,
        cover_url,
        is_default
      `,
      )
      .eq("game_id", game.id)
      .order("region", { ascending: true }),

    supabase
      .from("game_platforms")
      .select(
        `
        id,
        region,
        release_date,
        physical,
        digital,
        edition_name,
        platforms (
          id,
          name,
          manufacturer,
          slug,
          is_legacy
        )
      `,
      )
      .eq("game_id", game.id),

    supabase
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
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3),

    game.series
      ? supabase
          .from("games")
          .select(
            `
            id,
            title,
            slug,
            cover_url,
            release_year
          `,
          )
          .eq("series", game.series)
          .neq("id", game.id)
          .order("release_year", { ascending: true })
          .limit(6)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (user) {
    const [profileResult, followedGameResult, collectionResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle(),

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
              manufacturer,
              slug,
              is_legacy
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("game_id", game.id),
      ]);

    isAdmin = Boolean(profileResult.data?.is_admin);
    isFollowed = Boolean(followedGameResult.data);

    collectionEntries = ((collectionResult.data ?? []) as unknown as CollectionEntry[])
      .flatMap((item) => {
        const platform = normalizeRelation(item.platforms);

        if (!platform) {
          return [];
        }

        return [
          {
            id: item.id,
            status: item.status,
            format: item.format,
            region: item.region,
            platform,
          },
        ];
      });
  }

  const covers = ((coversResult.data ?? []) as unknown as GameCover[]).filter(
    (cover) =>
      COVER_REGIONS.includes(cover.region) && Boolean(cover.cover_url?.trim()),
  );

  const selectedCover =
    covers.find((cover) => cover.region === selectedCoverRegion) ??
    covers.find((cover) => cover.is_default) ??
    covers[0] ??
    null;

  const coverUrl = selectedCover?.cover_url ?? game.cover_url;

  const tags =
    game.game_tags
      ?.flatMap((relation) => {
        const tag = normalizeRelation(relation.tags);

        return tag ? [tag] : [];
      }) ?? [];

  const releaseVersions: NormalizedVersion[] =
    game.game_releases?.flatMap((release) => {
      const platform = normalizeRelation(release.platforms);

      if (!platform) {
        return [];
      }

      return [
        {
          id: `release-${release.id}`,
          source: "release" as const,
          region: release.region,
          release_date: release.release_date,
          physical: release.physical,
          digital: release.digital,
          status: release.status,
          edition_name: release.edition_name,
          platform,
        },
      ];
    }) ?? [];

  const platformVersions: NormalizedVersion[] = (
    (gamePlatformsResult.data ?? []) as unknown as GamePlatformRelation[]
  ).flatMap((version) => {
    const platform = normalizeRelation(version.platforms);

    if (!platform) {
      return [];
    }

    return [
      {
        id: `platform-${version.id}`,
        source: "platform" as const,
        region: version.region,
        release_date: version.release_date,
        physical: version.physical,
        digital: version.digital,
        status: null,
        edition_name: version.edition_name,
        platform,
      },
    ];
  });

  const versionsToDisplay = [...releaseVersions, ...platformVersions].sort(
    (a, b) => {
      const dateA = a.release_date ?? "9999-12-31";
      const dateB = b.release_date ?? "9999-12-31";
      const dateCompare = dateA.localeCompare(dateB);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.platform.name.localeCompare(b.platform.name, "fr");
    },
  );

  const platformsToDisplay = Array.from(
    new Map(
      versionsToDisplay.map((version) => [version.platform.id, version.platform]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const relatedNews = (relatedNewsResult.data ?? []) as RelatedNews[];
  const relatedGames = (relatedGamesResult.data ?? []) as RelatedGame[];

  const firstReleaseLabel = getFirstReleaseLabel(
    versionsToDisplay,
    game.release_year,
  );

  const languageInfoItems = [
    {
      label: "Voix FR",
      value: formatBooleanInfo(game.french_audio),
      hasValue: game.french_audio !== null,
    },
    {
      label: "Sous-titres FR",
      value: formatBooleanInfo(game.french_subtitles),
      hasValue: game.french_subtitles !== null,
    },
  ];

  const visibleLanguageInfoItems = isAdmin
    ? languageInfoItems
    : languageInfoItems.filter((item) => item.hasValue);

  const infoItems = [
    {
      label: "Première sortie",
      value: firstReleaseLabel,
      hasValue: firstReleaseLabel !== "Inconnue",
    },
    {
      label: "Développeur",
      value: game.developer ?? "Inconnu",
      hasValue: Boolean(game.developer),
    },
    {
      label: "Éditeur",
      value: game.publisher ?? "Inconnu",
      hasValue: Boolean(game.publisher),
    },
    ...visibleLanguageInfoItems,
  ].filter((item) => isAdmin || item.hasValue);

  const qualityIssues = getQualityIssues({
    game,
    versions: versionsToDisplay,
    covers,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.20),transparent_34rem),radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_30rem)]">
        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-8">
          <Link href="/games" className="text-sm text-purple-300 underline">
            ← Retour au catalogue
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`Jaquette de ${game.title}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_15rem)] px-6 text-center text-xl font-bold text-purple-300">
                    {game.title}
                  </div>
                )}
              </div>

              {covers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {COVER_REGIONS.map((region) => {
                    const cover = covers.find((item) => item.region === region);
                    const active = selectedCover?.region === region;

                    if (!cover) {
                      return null;
                    }

                    return (
                      <Link
                        key={region}
                        href={`/games/${game.slug}?cover=${region}`}
                        className={
                          active
                            ? "rounded-full border border-purple-500 bg-purple-600 px-3 py-1 text-xs font-semibold text-white"
                            : "rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 hover:border-purple-500 hover:text-white"
                        }
                      >
                        {region}
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <AddToCollectionButton gameId={game.id} />

                <FollowGameButton
                  gameId={game.id}
                  initialIsFollowed={isFollowed}
                />
              </div>

              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-400">
                  Mon Vault
                </p>

                {!user ? (
                  <div className="mt-4">
                    <p className="text-sm text-slate-400">
                      Connecte-toi pour voir ton statut sur ce jeu.
                    </p>

                    <Link
                      href="/auth/login"
                      className="mt-4 inline-block rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                    >
                      Se connecter
                    </Link>
                  </div>
                ) : collectionEntries.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-400">
                    Ce jeu n’est pas encore dans ta collection.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {collectionEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`rounded border px-2 py-1 text-xs font-semibold ${getPlatformTagClass(
                              entry.platform,
                            )}`}
                          >
                            {entry.platform.name}
                          </span>

                          <span className="text-sm font-semibold text-white">
                            {formatCollectionStatus(entry.status)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">
                          {formatCollectionFormat(entry.format)}
                          {entry.region ? ` · ${entry.region}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>

            <div className="min-w-0">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                {game.series && (
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                    {game.series}
                  </p>
                )}

                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white lg:text-5xl">
                  {game.title}
                </h1>

                {platformsToDisplay.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {platformsToDisplay.map((platform) => (
                      <span
                        key={platform.id}
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${getPlatformTagClass(
                          platform,
                        )}`}
                      >
                        {platform.name}
                      </span>
                    ))}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-1 text-sm text-purple-200"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {infoItems.length > 0 && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {infoItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.label}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {isAdmin && qualityIssues.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-950/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
                      Qualité des données
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {qualityIssues.map((issue) => (
                        <span
                          key={issue}
                          className="rounded-full border border-yellow-500/40 bg-yellow-950/60 px-3 py-1 text-xs font-semibold text-yellow-100"
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-xl font-bold text-white">Description</h2>

                  {game.description ? (
                    <p className="mt-3 max-w-5xl whitespace-pre-line leading-7 text-slate-300">
                      {game.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-slate-400">
                      Aucune description n’est encore renseignée pour ce jeu.
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-8 border-t border-slate-800 pt-5">
                    <Link
                      href={`/admin/games/${game.id}/edit`}
                      className="inline-flex rounded-xl border border-purple-500/60 bg-purple-950/40 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-900/70 hover:text-white"
                    >
                      Modifier la fiche
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-6 py-10 lg:px-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                  Versions
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  Versions et sorties
                </h2>
              </div>

              <Link href="/releases" className="text-sm text-purple-300 underline">
                Voir le calendrier →
              </Link>
            </div>

            {versionsToDisplay.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                Aucune version n’est encore renseignée pour ce jeu.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {versionsToDisplay.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-semibold ${getPlatformTagClass(
                          version.platform,
                        )}`}
                      >
                        {version.platform.name}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          version.status,
                        )}`}
                      >
                        {formatStatus(version.status)}
                      </span>
                    </div>

                    <p className="mt-4 text-xl font-bold text-white">
                      {formatDate(version.release_date)}
                    </p>

                    <div className="mt-5 grid gap-2 text-sm text-slate-400">
                      <div className="flex justify-between gap-3">
                        <span>Région</span>
                        <span className="text-slate-200">
                          {version.region ?? "Inconnue"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Format</span>
                        <span className="text-slate-200">
                          {formatReleaseFormat(version.physical, version.digital)}
                        </span>
                      </div>

                      {version.edition_name?.trim() && (
                        <div className="flex justify-between gap-3">
                          <span>Édition</span>
                          <span className="text-slate-200">
                            {version.edition_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                  Actualités
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  News liées au jeu
                </h2>
              </div>

              <Link href="/news" className="text-sm text-purple-300 underline">
                Toutes les news →
              </Link>
            </div>

            {relatedNews.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                Aucune actualité liée à ce jeu pour le moment.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 hover:border-purple-500"
                  >
                    <div className="relative aspect-[16/9] bg-slate-800">
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt={`Image de ${news.title}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-purple-300">
                          JRPG Vault
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-purple-600 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                          {getCategoryLabel(news.category)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatDate(news.published_at)}
                        </span>
                      </div>

                      <h3 className="mt-3 line-clamp-2 font-semibold text-white">
                        {news.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {getNewsText(news)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid gap-8 content-start">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Jeux liés
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Même série
            </h2>

            {relatedGames.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                Aucun autre jeu de cette série n’est encore référencé.
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {relatedGames.map((relatedGame) => (
                  <Link
                    key={relatedGame.id}
                    href={`/games/${relatedGame.slug}`}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-purple-500"
                  >
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {relatedGame.cover_url ? (
                        <img
                          src={relatedGame.cover_url}
                          alt={`Jaquette de ${relatedGame.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-purple-300">
                          JRPG
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold text-white">
                        {relatedGame.title}
                      </p>

                      {relatedGame.release_year && (
                        <p className="mt-1 text-sm text-slate-500">
                          {relatedGame.release_year}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Liens rapides
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/games"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Explorer le catalogue
              </Link>

              <Link
                href="/collection"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Voir ma collection
              </Link>

              <Link
                href="/releases"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Calendrier des sorties
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
