import { createClient } from "@/utils/supabase/server";
import GamesList from "./GamesList";

type Game = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
};

export default async function GamesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("id, title, slug, series, release_year")
    .order("title");

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Catalogue JRPG</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const games = (data ?? []) as Game[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Catalogue JRPG</h1>

      <p className="mt-2 text-gray-600">
        Découvre les JRPG disponibles dans le catalogue.
      </p>

      <GamesList games={games} />
    </main>
  );
}
