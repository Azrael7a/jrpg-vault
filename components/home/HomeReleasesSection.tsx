"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type HomeRelease = {
  id: number;
  game_id: number;
  release_date: string | null;
  edition_name: string | null;
  region: string | null;
  game: {
    id: number;
    title: string;
    slug: string;
    cover_url: string | null;
  } | null;
  platform: {
    id: number;
    name: string;
  } | null;
};

const platformFilters = ["Tous", "PS4", "PS5", "Switch", "Switch 2", "PC"];

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(date).toLocaleDateString("fr-FR");
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

  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      const matchesPlatform =
        platformFilter === "Tous" || release.platform?.name === platformFilter;

      const matchesFollowed =
        !onlyFollowed || followedGameIds.includes(release.game_id);

      return matchesPlatform && matchesFollowed;
    });
  }, [releases, platformFilter, onlyFollowed, followedGameIds]);

  return (
    <section className="mx-auto max-w-6xl px-8 pb-16">
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
                className={
                  platformFilter === platform
                    ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                    : "rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                }
              >
                {platform}
              </button>
            ))}

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
          </div>
        </div>

        {!isLoggedIn && onlyFollowed && (
          <div className="mt-4 rounded-xl border border-purple-900 bg-purple-950/40 p-4 text-sm text-purple-100">
            Connecte-toi pour filtrer les sorties selon les jeux de ta
            collection.
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredReleases.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Aucune sortie ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            filteredReleases.map((release) => (
              <Link
                key={release.id}
                href={release.game ? `/games/${release.game.slug}` : "/releases"}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500"
              >
                <div className="aspect-[16/9] bg-slate-800">
                  {release.game?.cover_url ? (
                    <img
                      src={release.game.cover_url}
                      alt={`Jaquette de ${release.game.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      Pas de jaquette
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white">
                    {release.game?.title ?? "Jeu inconnu"}
                  </h3>

                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-400">
                      {formatDate(release.release_date)}
                    </span>

                    <span className="rounded bg-slate-800 px-2 py-1 text-xs text-purple-200">
                      {release.platform?.name ?? "?"}
                    </span>
                  </div>

                  {release.edition_name && (
                    <p className="mt-2 text-xs text-slate-500">
                      {release.edition_name}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
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
