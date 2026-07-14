import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type RawRelease = {
  id: number;
  game_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type PlatformRelease = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  platform: PlatformRelation;
};

type GroupedRelease = {
  game_id: number;
  game: GameRelation;
  release_date: string | null;
  platformReleases: PlatformRelease[];
};

type MonthGroup = {
  key: string;
  label: string;
  releases: GroupedRelease[];
};

type FollowedGameRow = {
  game_id: number | null;
};

const platformFilters = [
  { label: "Tous", value: "all" },
  { label: "PS4", value: "ps4" },
  { label: "PS5", value: "ps5" },
  { label: "Switch", value: "switch" },
  { label: "Switch 2", value: "switch-2" },
  { label: "Xbox", value: "xbox" },
  { label: "PC", value: "pc" },
];

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizePlatformName(name: string) {
  return name.toLowerCase().trim();
}

function isPlayStationPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5") ||
    normalizedName.includes("playstation")
  );
}

function isSwitchPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName === "switch" ||
    normalizedName === "nintendo switch" ||
    normalizedName.includes("switch 2") ||
    normalizedName.includes("switch2")
  );
}

function isXboxPlatform(name: string) {
  return normalizePlatformName(name).includes("xbox");
}

function isPcPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  );
}

function platformMatchesFilter(platformName: string, filter: string) {
  const normalizedName = normalizePlatformName(platformName);

  switch (filter) {
    case "all":
      return true;

    case "ps4":
      return (
        normalizedName.includes("ps4") ||
        normalizedName.includes("playstation 4")
      );

    case "ps5":
      return (
        normalizedName.includes("ps5") ||
        normalizedName.includes("playstation 5")
      );

    case "switch":
      return (
        normalizedName === "switch" ||
        normalizedName === "nintendo switch"
      );

    case "switch-2":
      return (
        normalizedName.includes("switch 2") ||
        normalizedName.includes("switch2")
      );

    case "xbox":
      return isXboxPlatform(platformName);

    case "pc":
      return isPcPlatform(platformName);

    default:
      return true;
  }
}

function getPlatformTagClass(platformName: string) {
  if (isSwitchPlatform(platformName)) {
    return "border-[#E60012] bg-[#E60012] text-white";
  }

  if (isPlayStationPlatform(platformName)) {
    return "border-[#0070CC] bg-[#0070CC] text-white";
  }

  if (isXboxPlatform(platformName)) {
    return "border-[#107C10] bg-[#107C10] text-white";
  }

  if (isPcPlatform(platformName)) {
    return "border-black bg-black text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatShortDate(date: string | null) {
  if (!date) {
    return "?";
  }

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatMonthYear(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  const label = new Date(date).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMonthKey(date: string | null) {
  if (!date) {
    return "unknown";
  }

  return date.slice(0, 7);
}

function formatStatus(status: string | null) {
  switch (status) {
    case "confirmed":
      return "Confirmé";
    case "rumor":
      return "Rumeur";
    case "delayed":
      return "Repoussé";
    case "released":
      return "Sorti";
    default:
      return "Statut inconnu";
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "confirmed":
      return "border-green-500/40 bg-green-950/70 text-green-200";
    case "rumor":
      return "border-yellow-500/40 bg-yellow-950/70 text-yellow-200";
    case "delayed":
      return "border-orange-500/40 bg-orange-950/70 text-orange-200";
    case "released":
      return "border-slate-500/40 bg-slate-800 text-slate-200";
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
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

function hasDifferentDates(platformReleases: PlatformRelease[]) {
  const dates = new Set(
    platformReleases
      .map((platformRelease) => platformRelease.release_date)
      .filter(Boolean),
  );

  return dates.size > 1;
}

function groupReleasesByGame(releases: RawRelease[]) {
  const grouped = new Map<number, GroupedRelease>();

  for (const release of releases) {
    const game = normalizeRelation(release.games);
    const platform = normalizeRelation(release.platforms);

    if (!game || !platform) {
      continue;
    }

    const existing = grouped.get(release.game_id);

    const platformRelease: PlatformRelease = {
      id: release.id,
      region: release.region,
      release_date: release.release_date,
      physical: release.physical,
      digital: release.digital,
      status: release.status,
      edition_name: release.edition_name,
      platform,
    };

    if (!existing) {
      grouped.set(release.game_id, {
        game_id: release.game_id,
        game,
        release_date: release.release_date,
        platformReleases: [platformRelease],
      });

      continue;
    }

    existing.platformReleases.push(platformRelease);

    if (
      release.release_date &&
      (!existing.release_date || release.release_date < existing.release_date)
    ) {
      existing.release_date = release.release_date;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const dateA = a.release_date ?? "9999-12-31";
    const dateB = b.release_date ?? "9999-12-31";

    return dateA.localeCompare(dateB);
  });
}

function groupReleasesByMonth(releases: GroupedRelease[]): MonthGroup[] {
  const monthGroups = new Map<string, MonthGroup>();

  for (const release of releases) {
    const key = getMonthKey(release.release_date);
    const existingMonth = monthGroups.get(key);

    if (!existingMonth) {
      monthGroups.set(key, {
        key,
        label: formatMonthYear(release.release_date),
        releases: [release],
      });

      continue;
    }

    existingMonth.releases.push(release);
  }

  return Array.from(monthGroups.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

function buildFilterUrl(platform: string, followed: boolean) {
  const params = new URLSearchParams();

  if (platform !== "all") {
    params.set("platform", platform);
  }

  if (followed) {
    params.set("followed", "1");
  }

  const query = params.toString();

  return query ? `/releases?${query}` : "/releases";
}

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    platform?: string;
    followed?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;

  const activePlatform = resolvedSearchParams.platform ?? "all";
  const onlyFollowed = resolvedSearchParams.followed === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { data: releasesData, error } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      game_id,
      region,
      release_date,
      physical,
      digital,
      status,
      edition_name,
      games (
        id,
        title,
        slug,
        cover_url
      ),
      platforms (
        id,
        name,
        manufacturer
      )
    `,
    )
    .not("release_date", "is", null)
    .gte("release_date", today)
    .neq("status", "released")
    .order("release_date", { ascending: true });

  let followedGameIds: number[] = [];

  if (user) {
    const { data: followedData } = await supabase
      .from("user_followed_games")
      .select("game_id")
      .eq("user_id", user.id);

    followedGameIds = (
      (followedData ?? []) as unknown as FollowedGameRow[]
    )
      .map((item) => item.game_id)
      .filter((gameId): gameId is number => typeof gameId === "number");
  }

  const groupedReleases = groupReleasesByGame(
    (releasesData ?? []) as unknown as RawRelease[],
  );

  const filteredReleases = groupedReleases.filter((release) => {
    const matchesPlatform =
      activePlatform === "all" ||
      release.platformReleases.some((platformRelease) =>
        platformMatchesFilter(platformRelease.platform.name, activePlatform),
      );

    const matchesFollowed =
      !onlyFollowed || followedGameIds.includes(release.game_id);

    return matchesPlatform && matchesFollowed;
  });

  const monthGroups = groupReleasesByMonth(filteredReleases);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Calendrier
          </p>

          <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Prochaines sorties JRPG
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Suis les prochaines sorties par jeu, support, date et statut.
                Les sorties sont maintenant classées par mois et année.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
              <span className="text-2xl font-bold text-white">
                {filteredReleases.length}
              </span>{" "}
              jeux affichés
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {platformFilters.map((filter) => (
              <Link
                key={filter.value}
                href={buildFilterUrl(filter.value, onlyFollowed)}
                className={
                  activePlatform === filter.value
                    ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                    : "rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                }
              >
                {filter.label}
              </Link>
            ))}

            {user ? (
              <Link
                href={buildFilterUrl(activePlatform, !onlyFollowed)}
                className={
                  onlyFollowed
                    ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                    : "rounded border border-purple-500 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-950"
                }
              >
                ★ Mes jeux suivis
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="rounded border border-purple-500 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-950"
              >
                ★ Mes jeux suivis
              </Link>
            )}
          </div>

          {monthGroups.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {monthGroups.map((monthGroup) => (
                <a
                  key={monthGroup.key}
                  href={`#month-${monthGroup.key}`}
                  className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:border-purple-500 hover:text-white"
                >
                  {monthGroup.label}
                  <span className="ml-2 text-slate-500">
                    {monthGroup.releases.length}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-8 py-10">
        {error && (
          <div className="mb-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">
            Erreur pendant le chargement des sorties : {error.message}
          </div>
        )}

        {filteredReleases.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
            <h2 className="text-2xl font-bold text-white">
              Aucune sortie trouvée
            </h2>

            <p className="mt-3 text-slate-400">
              Aucun jeu ne correspond aux filtres sélectionnés.
            </p>

            <Link
              href="/releases"
              className="mt-6 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="grid gap-12">
            {monthGroups.map((monthGroup) => (
              <section
                key={monthGroup.key}
                id={`month-${monthGroup.key}`}
                className="scroll-mt-24"
              >
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                      Mois de sortie
                    </p>

                    <h2 className="text-2xl font-bold text-white">
                      {monthGroup.label}
                    </h2>
                  </div>

                  <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-300">
                    {monthGroup.releases.length} jeu
                    {monthGroup.releases.length > 1 ? "x" : ""}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {monthGroup.releases.map((release) => {
                    const differentDates = hasDifferentDates(
                      release.platformReleases,
                    );

                    const mainStatus =
                      release.platformReleases[0]?.status ?? "confirmed";

                    return (
                      <Link
                        key={release.game_id}
                        href={`/games/${release.game.slug}`}
                        className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl transition hover:border-purple-500 hover:bg-slate-900"
                      >
                        <div className="relative aspect-[16/9] bg-slate-800">
                          {release.game.cover_url ? (
                            <img
                              src={release.game.cover_url}
                              alt={`Jaquette de ${release.game.title}`}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center px-6 text-center text-xl font-bold text-purple-300">
                              {release.game.title}
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                mainStatus,
                              )}`}
                            >
                              {formatStatus(mainStatus)}
                            </span>

                            {followedGameIds.includes(release.game_id) && (
                              <span className="rounded-full border border-purple-400 bg-slate-950/90 px-3 py-1 text-xs font-semibold text-purple-200">
                                ★ Suivi
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-5">
                          <h2 className="line-clamp-2 text-xl font-bold text-white">
                            {release.game.title}
                          </h2>

                          <p className="mt-3 text-sm text-slate-400">
                            {differentDates
                              ? "Première sortie : "
                              : "Sortie : "}
                            <span className="font-medium text-slate-200">
                              {formatDate(release.release_date)}
                            </span>
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {release.platformReleases.map(
                              (platformRelease) => (
                                <span
                                  key={platformRelease.id}
                                  className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                                    platformRelease.platform.name,
                                  )}`}
                                >
                                  {platformRelease.platform.name}
                                  {differentDates
                                    ? ` · ${formatShortDate(
                                        platformRelease.release_date,
                                      )}`
                                    : ""}
                                </span>
                              ),
                            )}
                          </div>

                          <div className="mt-5 grid gap-2 text-sm text-slate-400">
                            {release.platformReleases
                              .slice(0, 3)
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                                >
                                  <span>{item.platform.name}</span>

                                  <span className="text-right text-slate-300">
                                    {formatDate(item.release_date)}
                                  </span>
                                </div>
                              ))}

                            {release.platformReleases.length > 3 && (
                              <p className="text-xs text-slate-500">
                                + {release.platformReleases.length - 3} autre(s)
                                support(s)
                              </p>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>
                              {formatReleaseFormat(
                                release.platformReleases[0]?.physical ?? null,
                                release.platformReleases[0]?.digital ?? null,
                              )}
                            </span>

                            {release.platformReleases[0]?.region && (
                              <span>
                                · {release.platformReleases[0].region}
                              </span>
                            )}

                            {release.platformReleases[0]?.edition_name && (
                              <span>
                                · {release.platformReleases[0].edition_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
