"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Game = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
};

export default function GamesList({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="mt-8 rounded-xl border bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold">Catalogue vide</h2>

        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Aucun JRPG n’a encore été ajouté au catalogue. Ajoute des jeux depuis
          Supabase pour commencer à construire ta base.
        </p>
      </div>
    );
  }
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return games;
    }

    return games.filter((game) => {
      return (
        game.title.toLowerCase().includes(query) ||
        game.series?.toLowerCase().includes(query) ||
        String(game.release_year ?? "").includes(query)
      );
    });
  }, [games, search]);

  return (
    <div className="mt-6">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Rechercher un JRPG</span>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Final Fantasy, Xenoblade, Fire Emblem..."
          className="rounded border px-4 py-2"
        />
      </label>

      <p className="mt-3 text-sm text-gray-600">
        {filteredGames.length} jeu(x) trouvé(s)
      </p>

      <div className="mt-6 grid gap-4">
        {filteredGames.length === 0 && (
          <div className="rounded-xl border p-4 text-gray-600">
            Aucun jeu ne correspond à ta recherche.
          </div>
        )}

        {filteredGames.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="rounded-xl border p-4 hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold">{game.title}</h2>
            <p className="text-gray-600">{game.series}</p>
            <p className="text-sm text-gray-500">{game.release_year}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
