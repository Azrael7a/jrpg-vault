"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type Platform = {
  id: number;
  name: string;
  slug: string;
  manufacturer: string | null;
  generation: number | null;
  is_legacy: boolean;
  display_order: number;
};

type Game = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  tags: {
    id: number;
    name: string;
  }[];
  platforms: Platform[];
  collection_statuses: CollectionStatus[];
};

type StatusFilter = CollectionStatus | "all" | "in_collection" | "not_added";

type SortOption =
  | "title_asc"
  | "title_desc"
  | "release_desc"
  | "release_asc"
  | "series_asc";

const statusLabels: Record<CollectionStatus, string> = {
  owned: "Possédé",
  playing: "En cours",
  completed: "Terminé",
  backlog: "À faire",
  wishlist: "Wishlist",
  preordered: "Précommandé",
  abandoned: "Abandonné",
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "in_collection", label: "Dans ma collection" },
  { value: "not_added", label: "Non ajouté" },
  { value: "owned", label: "Possédé" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "backlog", label: "À faire" },
  { value: "wishlist", label: "Wishlist" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "title_asc", label: "Nom A-Z" },
  { value: "title_desc", label: "Nom Z-A" },
  { value: "release_desc", label: "Date récente" },
  { value: "release_asc", label: "Date ancienne" },
  { value: "series_asc", label: "Série A-Z" },
];

function getStatusClass(status: CollectionStatus) {
  switch (status) {
    case "completed":
      return "status-termine";
    case "playing":
      return "status-en-cours";
    case "backlog":
      return "status-a-faire";
    case "wishlist":
      return "status-wishlist";
    case "abandoned":
      return "status-abandonne";
    default:
      return "";
  }
}

function comparePlatforms(a: Platform, b: Platform) {
  if (a.is_legacy !== b.is_legacy) {
    return Number(a.is_legacy) - Number(b.is_legacy);
  }

  if (a.display_order !== b.display_order) {
    return a.display_order - b.display_order;
  }

  return a.name.localeCompare(b.name, "fr");
}

export default function GamesList({ games }: { games: Game[] }) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("title_asc");

  const platformOptions = useMemo(() => {
    const platformMap = new Map<number, Platform>();

    games.forEach((game) => {
      game.platforms.forEach((platform) => {
        platformMap.set(platform.id, platform);
      });
    });

    return Array.from(platformMap.values()).sort(comparePlatforms);
  }, [games]);

  const currentPlatforms = useMemo(
    () => platformOptions.filter((platform) => !platform.is_legacy),
    [platformOptions],
  );

  const legacyPlatforms = useMemo(
    () => platformOptions.filter((platform) => platform.is_legacy),
    [platformOptions],
  );

  const genreOptions = useMemo(() => {
    return Array.from(
      new Set(
        games.flatMap((game) => game.tags.map((tag) => tag.name)).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [games]);

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = games.filter((game) => {
      const searchableText = [
        game.title,
        game.series,
        game.developer,
        game.publisher,
        game.release_year,
        ...game.tags.map((tag) => tag.name),
        ...game.platforms.flatMap((platform) => [
          platform.name,
          platform.manufacturer,
          platform.generation ? `génération ${platform.generation}` : null,
          platform.is_legacy ? "rétro ancien" : "actuel moderne",
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesPlatform = (() => {
        if (platformFilter === "all") {
          return true;
        }

        if (platformFilter === "group:current") {
          return game.platforms.some((platform) => !platform.is_legacy);
        }

        if (platformFilter === "group:legacy") {
          return game.platforms.some((platform) => platform.is_legacy);
        }

        return game.platforms.some(
          (platform) => String(platform.id) === platformFilter,
        );
      })();

      const matchesGenre =
        genreFilter === "all" ||
        game.tags.some((tag) => tag.name === genreFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_collection" &&
          game.collection_statuses.length > 0) ||
        (statusFilter === "not_added" &&
          game.collection_statuses.length === 0) ||
        game.collection_statuses.includes(statusFilter as CollectionStatus);

      return matchesSearch && matchesPlatform && matchesGenre && matchesStatus;
    });

    return [...result].sort((a, b) => {
      switch (sortOption) {
        case "title_desc":
          return b.title.localeCompare(a.title, "fr");
        case "release_desc":
          return (b.release_year ?? 0) - (a.release_year ?? 0);
        case "release_asc":
          return (a.release_year ?? 9999) - (b.release_year ?? 9999);
        case "series_asc":
          return (a.series ?? "zzzz").localeCompare(b.series ?? "zzzz", "fr");
        case "title_asc":
        default:
          return a.title.localeCompare(b.title, "fr");
      }
    });
  }, [games, genreFilter, platformFilter, search, sortOption, statusFilter]);

  const hasActiveFilters =
    search ||
    platformFilter !== "all" ||
    genreFilter !== "all" ||
    statusFilter !== "all" ||
    sortOption !== "title_asc";

  function resetFilters() {
    setSearch("");
    setPlatformFilter("all");
    setGenreFilter("all");
    setStatusFilter("all");
    setSortOption("title_asc");
  }

  if (games.length === 0) {
    return (
      <div className="jrpg-card mt-8 p-8 text-center">
        <h2 className="text-2xl font-bold">Catalogue vide</h2>

        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Aucun JRPG n’a encore été ajouté au catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <section className="jrpg-card p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <label className="grid gap-2 lg:col-span-3">
            <span className="text-sm font-medium text-slate-200">
              Rechercher un JRPG
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Final Fantasy, Xenoblade, PlayStation, rétro..."
              className="rounded-xl border px-4 py-3"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Plateforme
            </span>

            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">Toutes les plateformes</option>

              {currentPlatforms.length > 0 && (
                <optgroup label="Supports actuels">
                  <option value="group:current">Tous les supports actuels</option>
                  {currentPlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {legacyPlatforms.length > 0 && (
                <optgroup label="Supports rétro">
                  <option value="group:legacy">Tous les supports rétro</option>
                  {legacyPlatforms.map((platform) => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Genre</span>

            <select
              value={genreFilter}
              onChange={(event) => setGenreFilter(event.target.value)}
              className="rounded-xl border px-4 py-3"
            >
              <option value="all">Tous les genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Statut collection
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-xl border px-4 py-3"
            >
              {statusFilters.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-100">
              {filteredGames.length}
            </span>{" "}
            jeu(x) trouvé(s) sur {games.length}
          </p>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Tri
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                className="rounded-xl border px-3 py-2"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="jrpg-button-secondary px-4 py-2 text-sm"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </section>

      {filteredGames.length === 0 ? (
        <div className="jrpg-card mt-6 p-8 text-center">
          <h2 className="text-xl font-bold">Aucun jeu trouvé</h2>

          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            Essaie d’élargir ta recherche ou de retirer un filtre.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="jrpg-button-primary mt-5 px-4 py-2"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="jrpg-card group overflow-hidden transition hover:-translate-y-1"
            >
              <div className="aspect-[16/9] overflow-hidden border-b border-slate-800 bg-slate-900">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={`Jaquette de ${game.title}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-violet-950 px-4 text-center text-sm text-slate-400">
                    Pas de jaquette
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {game.release_year && (
                    <span className="jrpg-badge">{game.release_year}</span>
                  )}

                  {game.collection_statuses.slice(0, 2).map((status) => (
                    <span
                      key={status}
                      className={`jrpg-badge ${getStatusClass(status)}`}
                    >
                      {statusLabels[status]}
                    </span>
                  ))}

                  {game.collection_statuses.length === 0 && (
                    <span className="jrpg-badge">Non ajouté</span>
                  )}
                </div>

                <h2 className="mt-3 text-xl font-semibold text-slate-50">
                  {game.title}
                </h2>

                <p className="mt-1 min-h-5 text-sm text-slate-400">
                  {game.series ?? "Série non renseignée"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {game.platforms.slice(0, 3).map((platform) => (
                    <span
                      key={platform.id}
                      title={platform.is_legacy ? "Support rétro" : "Support actuel"}
                      className={
                        platform.is_legacy
                          ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200"
                          : "rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                      }
                    >
                      {platform.name}
                    </span>
                  ))}

                  {game.platforms.length > 3 && (
                    <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-400">
                      +{game.platforms.length - 3}
                    </span>
                  )}
                </div>

                {game.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {game.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
