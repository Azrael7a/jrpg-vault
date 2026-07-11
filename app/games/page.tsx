import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function GamesPage() {
  const supabase = await createClient();

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("title");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Catalogue JRPG</h1>

      {error && (
        <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-bold">Erreur Supabase</p>
          <p>{error.message}</p>
        </div>
      )}

      {!error && (
        <p className="mt-4 text-gray-600">
          Nombre de jeux trouvés : {games?.length ?? 0}
        </p>
      )}

      {!error && games?.length === 0 && (
        <div className="mt-6 rounded border p-4">
          Aucun jeu trouvé dans la table <strong>games</strong>.
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {games?.map((game) => (
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
    </main>
  );
}
