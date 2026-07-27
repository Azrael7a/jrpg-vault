"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Platform = {
  id: number;
  name: string;
  manufacturer?: string | null;
  slug?: string | null;
  is_legacy?: boolean | null;
};

type HomeRelease = {
  id: number;
  game_id: number;
  release_date: string | null;
  edition_name: string | null;
  region: string | null;
  physical?: boolean | null;
  digital?: boolean | null;
  status?: string | null;
  card_image_url?: string | null;
  game: {
    id: number;
    title: string;
    slug: string;
    cover_url: string | null;
  } | null;
  platform: Platform | null;
};

type GroupedPlatformRelease = {
  platform: Platform;
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
  image_url: string | null;
  release_date: string | null;
  platformReleases: GroupedPlatformRelease[];
  editionNames: string[];
};

const platformFilters = [
  "Tous",
  "PS5",
  "PS4",
  "Switch",
  "Switch 2",
  "Xbox Series S/X",
  "PC",
];

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

function formatShortDate(date: string | null) {
  if (!date) {
    return "?";
  }

  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(localDate);
}

function normalizePlatformName(name: string | null | undefined) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

function isPS5Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "ps5" ||
    normalizedSlug === "playstation-5" ||
    normalizedName === "ps5" ||
    normalizedName.includes("playstation 5")
  );
}

function isPS4Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "ps4" ||
    normalizedSlug === "playstation-4" ||
    normalizedName === "ps4" ||
    normalizedName.includes("playstation 4")
  );
}

function isSwitch2Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "switch-2" ||
    normalizedSlug === "nintendo-switch-2" ||
    normalizedName === "switch 2" ||
    normalizedName.includes("nintendo switch 2")
  );
}

function isSwitchPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    !isSwitch2Platform(platform) &&
    (normalizedSlug === "switch" ||
      normalizedSlug === "nintendo-switch" ||
      normalizedName === "switch" ||
      normalizedName.includes("nintendo switch"))
  );
}

function isXboxSeriesPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug.includes("xbox-series") ||
    normalizedName.includes("xbox series")
  );
}

function isNintendoPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);

  return (
    normalizedName.includes("nintendo") ||
    normalizedName.includes("switch") ||
    normalizedName.includes("game boy") ||
    normalizedName.includes("gameboy") ||
    normalizedName.includes("gba") ||
    normalizedName.includes("ds") ||
    normalizedName.includes("3ds") ||
    normalizedName === "nes" ||
    normalizedName === "snes" ||
    normalizedName.includes("nintendo 64") ||
    normalizedName.includes("n64") ||
    normalizedName.includes("gamecube") ||
    normalizedName.includes("game cube") ||
    normalizedName.includes("wii")
  );
}

function isPlayStationPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);

  return (
    normalizedName.includes("playstation") ||
    normalizedName.includes("ps1") ||
    normalizedName.includes("ps2") ||
    normalizedName.includes("ps3") ||
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5") ||
    normalizedName.includes("psp") ||
    normalizedName.includes("vita")
  );
}

function isXboxPlatform(platform: Platform) {
  return normalizePlatformName(platform.name).includes("xbox");
}

function platformMatchesFilter(platform: Platform, filter: string) {
  switch (filter) {
    case "Tous":
      return true;
    case "PS5":
      return isPS5Platform(platform);
    case "PS4":
      return isPS4Platform(platform);
    case "Switch":
      return isSwitchPlatform(platform);
    case "Switch 2":
      return isSwitch2Platform(platform);
    case "Xbox Series S/X":
      return isXboxSeriesPlatform(platform);
    case "PC":
      return isPcPlatform(platform);
    default:
      return true;
  }
}

function getPlatformTagClass(platform: Platform) {
  if (isSwitchPlatform(platform) || isSwitch2Platform(platform)) {
    return "border-red-500 bg-red-600 text-white";
  }

  if (isPS5Platform(platform) || isPS4Platform(platform)) {
    return "border-sky-500 bg-sky-600 text-white";
  }

  if (isXboxSeriesPlatform(platform) || isXboxPlatform(platform)) {
    return "border-green-500 bg-green-600 text-white";
  }

  if (isPcPlatform(platform)) {
    return "border-purple-500 bg-purple-600 text-white";
  }

  if (isNintendoPlatform(platform)) {
    return "border-red-500 bg-red-600 text-white";
  }

  if (isPlayStationPlatform(platform)) {
    return "border-sky-500 bg-sky-600 text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getFilterButtonClass(filter: string, currentFilter: string) {
  if (filter === currentFilter) {
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

    const releaseImageUrl = release.card_image_url ?? release.game.cover_url;
    const existingRelease = groupedReleases.get(release.game_id);

    if (!existingRelease) {
      groupedReleases.set(release.game_id, {
        game_id: release.game_id,
        game: release.game,
        image_url: releaseImageUrl,
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

    if (!existingRelease.image_url && releaseImageUrl) {
      existingRelease.image_url = releaseImageUrl;
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

  const groupedReleases = useMemo(
    () => groupReleasesByGame(releases),
    [releases],
  );

  const filteredReleases = useMemo(() => {
    return groupedReleases.filter((release) => {
      const matchesPlatform =
        platformFilter === "Tous" ||
        release.platformReleases.some((platformRelease) =>
          platformMatchesFilter(platformRelease.platform, platformFilter),
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
                    key={`${release.game_id}-${release.release_date ?? "unknown"}`}
                    href={`/games/${release.game.slug}`}
                    className="w-72 shrink-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500"
                  >
                    <div className="relative aspect-[16/9] bg-slate-800">
                      {release.image_url ? (
                        <img
                          src={release.image_url}
                          alt={`Image de sortie de ${release.game.title}`}
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
                              platformRelease.platform,
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
