"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type HomeRelease = {
  id: number;
  game_id: number;
  release_date: string | null;
  edition_name: string | null;
  region: string | null;
  physical?: boolean | null;
  digital?: boolean | null;
  status?: string | null;
  game: {
    id: number;
    title: string;
    slug: string;
    cover_url: string | null;
  } | null;
  platform: {
    id: number;
    name: string;
    manufacturer?: string | null;
  } | null;
};

type GroupedPlatformRelease = {
  platform: {
    id: number;
    name: string;
    manufacturer?: string | null;
  };
  release_date: string | null;
  edition_name: string | null;
  status: string | null | undefined;
};

type GroupedRelease = {
  game_id: number;
  game: {
    id: number;
    title: string;
    slug: string;
    cover_url: string | null;
  };
  release_date: string | null;
  platformReleases: GroupedPlatformRelease[];
  editionNames: string[];
};

const platformFilters = [
  "Tous",
  "PS4",
  "PS5",
  "Switch",
  "Switch 2",
  "Xbox",
  "PC",
];

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
  const normalizedName = normalizePlatformName(name);

  return normalizedName.includes("xbox");
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
    case "Tous":
      return true;

    case "PS4":
      return (
        normalizedName.includes("ps4") ||
        normalizedName.includes("playstation 4")
      );

    case "PS5":
      return (
        normalizedName.includes("ps5") ||
        normalizedName.includes("playstation 5")
      );

    case "Switch":
      return (
        normalizedName === "switch" ||
        normalizedName === "nintendo switch"
      );

    case "Switch 2":
      return (
        normalizedName.includes("switch 2") ||
        normalizedName.includes("switch2")
      );

    case "Xbox":
      return isXboxPlatform(platformName);

    case "PC":
      return isPcPlatform(platformName);

    default:
      return normalizedName === normalizePlatformName(filter);
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

function getFilterButtonClass(filter: string, currentFilter: string) {
  const isActive = filter === currentFilter;

  if (isActive) {
    return "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white";
  }

  return "rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800";
}

function hasDifferentDates(platformReleases: GroupedPlatformRelease[]) {
  const dates = new Set(
    platformReleases
      .map((platformRelease) => platformRelease.release_date)
      .filter(Boolean),
  );

  return dates.size > 1;
}

function groupReleasesByGame(releases: HomeRelease[]) {
  const groupedReleases = new Map<number, GroupedRelease>();

  for (const release of releases) {
    if (!release.game || !release.platform) {
      continue;
    }

    const existingRelease = groupedReleases.get(release.game_id);

    if (!existingRelease) {
      groupedReleases.set(release.game_id, {
        game_id: release.game_id,
        game: release.game,
        release_date: release.release_date,
        platformReleases: [
          {
            platform: release.platform,
            release_date: release.release_date,
            edition_name: release.edition_name,
            status: release.status,
          },
        ],
        editionNames: release.edition_name ? [release.edition_name] : [],
      });

      continue;
    }

    const existingPlatformRelease = existingRelease.platformReleases.find(
      (platformRelease) => platformRelease.platform.id === release.platform?.id,
    );

    if (!existingPlatformRelease) {
      existingRelease.platformReleases.push({
        platform: release.platform,
        release_date: release.release_date,
        edition_name: release.edition_name,
        status: release.status,
      });
    }

    if (
      release.edition_name &&
      !existingRelease.editionNames.includes(release.edition_name)
    ) {
      existingRelease.editionNames.push(release.edition_name);
    }

    if (
      release.release_date &&
      (!existingRelease.release_date ||
        release.release_date < existingRelease.release_date)
    ) {
      existingRelease.release_date = release.release_date;
    }
  }

  return Array.from(groupedReleases.values()).sort((a, b) => {
    const dateA = a.release_date ?? "9999-12-31";
    const dateB = b.release_date ?? "9999-12-31";

    return dateA.localeCompare(dateB);
  });
}

export default function HomeReleasesSection({
  releases,
  followedGameIds,
  isLoggedIn,
}: {
  releases: HomeRelease[];
  followedGameIds: number[];
  isLoggedIn: boolean;
}) {
  const [platformFilter, setPlatformFilter] = useState("Tous");
  const [onlyFollowed, setOnlyFollowed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const groupedReleases = useMemo(() => {
    return groupReleasesByGame(releases);
  }, [releases]);

  const filteredReleases = useMemo(() => {
    return groupedReleases.filter((release) => {
      const matchesPlatform =
        platformFilter === "Tous" ||
        release.platformReleases.some((platformRelease) =>
          platformMatchesFilter(platformRelease.platform.name, platformFilter),
        );

      const matchesFollowed =
        !onlyFollowed || followedGameIds.includes(release.game_id);

      return matchesPlatform && matchesFollowed;
    });
  }, [groupedReleases, platformFilter, onlyFollowed, followedGameIds]);

  function scrollReleases(direction: "left" | "right") {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "left" ? -420 : 420,
      behavior: "smooth",
    });
  }

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Calendrier
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Sorties à venir
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {platformFilters.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setPlatformFilter(platform)}
                className={getFilterButtonClass(platform, platformFilter)}
              >
                {platform}
              </button>
            ))}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setOnlyFollowed((value) => !value)}
                className={
                  onlyFollowed
                    ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                    : "rounded border border-purple-500 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-950"
                }
              >
                ★ Mes jeux suivis
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="rounded border border-purple-500 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-950"
              >
                ★ Mes jeux suivis
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => scrollReleases("left")}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xl text-slate-200 hover:border-purple-500 hover:text-purple-300 md:flex"
            aria-label="Faire défiler les sorties vers la gauche"
          >
            ←
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-3"
          >
            {filteredReleases.length === 0 ? (
              <div className="min-w-full rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                Aucune sortie ne correspond aux filtres sélectionnés.
              </div>
            ) : (
              filteredReleases.map((release) => {
                const differentDates = hasDifferentDates(
                  release.platformReleases,
                );

                return (
                  <Link
                    key={release.game_id}
                    href={`/games/${release.game.slug}`}
                    className="w-72 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500"
                  >
                    <div className="relative aspect-[16/9] bg-slate-800">
                      {release.game.cover_url ? (
                        <img
                          src={release.game.cover_url}
                          alt={`Jaquette de ${release.game.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-4 text-center text-lg font-bold text-purple-300">
                          {release.game.title}
                        </div>
                      )}

                      {followedGameIds.includes(release.game_id) && (
                        <div className="absolute right-3 top-3 rounded-full border border-purple-400 bg-slate-950/90 px-2 py-1 text-xs text-purple-200">
                          ★ Suivi
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-12 font-semibold text-white">
                        {release.game.title}
                      </h3>

                      <p className="mt-3 text-sm text-slate-400">
                        {differentDates ? "Première sortie : " : "Sortie : "}
                        {formatDate(release.release_date)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {release.platformReleases.map((platformRelease) => (
                          <span
                            key={platformRelease.platform.id}
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
                        ))}
                      </div>

                      <p className="mt-3 line-clamp-1 text-xs text-slate-500">
                        {release.editionNames.length > 0
                          ? release.editionNames.join(" · ")
                          : "Édition standard"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => scrollReleases("right")}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-xl text-slate-200 hover:border-purple-500 hover:text-purple-300 md:flex"
            aria-label="Faire défiler les sorties vers la droite"
          >
            →
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 md:hidden">
          Fais glisser horizontalement pour voir plus de sorties.
        </div>

        <div className="mt-6 text-center">
          <Link href="/releases" className="text-sm text-purple-300 underline">
            Voir toutes les sorties →
          </Link>
        </div>
      </div>
    </section>
  );
}
