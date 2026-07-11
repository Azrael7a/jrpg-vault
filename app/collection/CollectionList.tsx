"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeleteCollectionItemButton from "./DeleteCollectionItemButton";
import UpdateCollectionStatusSelect from "./UpdateCollectionStatusSelect";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionFormat = "physical" | "digital" | "both";

type CollectionRegion = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";

type CollectionItem = {
  id: number;
  status: CollectionStatus;
  format: CollectionFormat;
  region: CollectionRegion;
  personal_rating: number | null;
  notes: string | null;
  created_at: string | null;
  game: {
    id: number;
    title: string;
    slug: string;
    series: string | null;
    release_year: number | null;
    cover_url: string | null;
  } | null;
  platform: {
    id: number;
    name: string;
    manufacturer: string | null;
  } | null;
};

const statusLabels: Record<CollectionStatus, string> = {
  owned: "Possédé",
  playing: "En cours",
  completed: "Terminé",
  backlog: "Backlog",
  wishlist: "Wishlist",
  preordered: "Précommandé",
  abandoned: "Abandonné",
};

const formatLabels: Record<CollectionFormat, string> = {
  physical: "Physique",
  digital: "Dématérialisé",
  both: "Physique + démat",
};

export default function CollectionList({ items }: { items: CollectionItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const platforms = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => item.platform?.name).filter(Boolean))
    ).sort() as string[];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const gameTitle = item.game?.title.toLowerCase() ?? "";
      const gameSeries = item.game?.series?.toLowerCase() ?? "";
      const platformName = item.platform?.name.toLowerCase() ?? "";

      const matchesSearch =
        !query ||
        gameTitle.includes(query) ||
        gameSeries.includes(query) ||
        platformName.includes(query);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      const matchesPlatform =
        platformFilter === "all" || item.platform?.name === platformFilter;

      const matchesFormat =
        formatFilter === "all" || item.format === formatFilter;

      const matchesRegion =
        regionFilter === "all" || item.region === regionFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPlatform &&
        matchesFormat &&
        matchesRegion
      );
    });
  }, [items, search, statusFilter, platformFilter, formatFilter, regionFilter]);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setFormatFilter("all");
    setRegionFilter("all");
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border p-4">
        <div className="grid gap-4 md:grid-cols-5">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium">Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Final Fantasy, Xenoblade, Switch..."
              className="rounded border px-3 py-2"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Statut</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="all">Tous</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Plateforme</span>
            <select
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="all">Toutes</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Format</span>
            <select
              value={formatFilter}
              onChange={(event) => setFormatFilter(event.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="all">Tous</option>
              {Object.entries(formatLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Région</span>
            <select
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="all">Toutes</option>
              <option value="PAL">PAL</option>
              <option value="US">US</option>
              <option value="JAP">JAP</option>
              <option value="ASIA">ASIA</option>
              <option value="WORLD">WORLD</option>
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 rounded border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Réinitialiser les filtres
          </button>

          <p className="mt-6 text-sm text-gray-600">
            {filteredItems.length} jeu(x) affiché(s) sur {items.length}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredItems.length === 0 && (
          <div className="rounded-xl border p-4 text-gray-600">
            Aucun jeu ne correspond aux filtres.
          </div>
        )}

        {filteredItems.map((item) => (
          <article key={item.id} className="rounded-xl border p-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div className="flex gap-4">
                <div className="h-32 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
                  {item.game?.cover_url ? (
                    <img
                      src={item.game.cover_url}
                      alt={`Jaquette de ${item.game.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-gray-500">
                      Pas de jaquette
                    </div>
                  )}
                </div>

                <div>
                  {item.game ? (
                    <Link
                      href={`/games/${item.game.slug}`}
                      className="text-xl font-semibold hover:underline"
                    >
                      {item.game.title}
                    </Link>
                  ) : (
                    <h2 className="text-xl font-semibold">Jeu inconnu</h2>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="rounded bg-gray-100 px-2 py-1">
                      {item.platform?.name ?? "Plateforme inconnue"}
                    </span>

                    <span className="rounded bg-gray-100 px-2 py-1">
                      {statusLabels[item.status]}
                    </span>

                    <span className="rounded bg-gray-100 px-2 py-1">
                      {formatLabels[item.format]}
                    </span>

                    <span className="rounded bg-gray-100 px-2 py-1">
                      {item.region}
                    </span>
                  </div>

                  {item.game?.series && (
                    <p className="mt-2 text-sm text-gray-600">
                      Série : {item.game.series}
                    </p>
                  )}

                  {item.game?.release_year && (
                    <p className="text-sm text-gray-600">
                      Année : {item.game.release_year}
                    </p>
                  )}

                  {item.personal_rating !== null && (
                    <p className="mt-2 text-sm">
                      Note personnelle : {item.personal_rating}/10
                    </p>
                  )}

                  {item.notes && (
                    <p className="mt-2 text-sm text-gray-700">{item.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 md:min-w-48">
                <UpdateCollectionStatusSelect
                  itemId={item.id}
                  currentStatus={item.status}
                />

                <DeleteCollectionItemButton itemId={item.id} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
