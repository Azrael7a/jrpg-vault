import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
};

type RawFollowedGame = {
  id: number;
  created_at: string | null;
  games: GameRelation | GameRelation[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default async function FollowedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("user_followed_games")
    .select(
      `
      id,
      created_at,
      games (
        id,
        title,
        slug,
        series,
        release_year,
        cover_url
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Jeux suivis</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const followedGames = ((data ?? []) as RawFollowedGame[]).map((item) => ({
    id: item.id,
    created_at: item.created_at,
    game: normalizeRelation(item.games),
  }));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Jeux suivis</h1>

      <p className="mt-2 text-gray-600">
        Les JRPG que tu surveilles pour leurs sorties et actualités.
      </p>

      {followedGames.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-gray-50 p-8 text-center">
          <h2 className="text-2xl font-bold">Aucun jeu suivi</h2>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Va dans le catalogue et clique sur “Suivre ce jeu” pour commencer à
            surveiller tes JRPG.
          </p>

          <Link
            href="/games"
            className="mt-6 inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {followedGames.map((item) => (
            <Link
              key={item.id}
              href={item.game ? `/games/${item.game.slug}` : "/games"}
              className="overflow-hidden rounded-xl border hover:bg-gray-50"
            >
              <div className="aspect-[16/9] bg-gray-100">
                {item.game?.cover_url ? (
                  <img
                    src={item.game.cover_url}
                    alt={`Jaquette de ${item.game.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                    Pas de jaquette
                  </div>
                )}
              </div>

              <div className="p-4">
                <h2 className="font-semibold">
                  {item.game?.title ?? "Jeu inconnu"}
                </h2>

                {item.game?.series && (
                  <p className="mt-1 text-sm text-gray-600">
                    {item.game.series}
                  </p>
                )}

                {item.game?.release_year && (
                  <p className="mt-1 text-sm text-gray-500">
                    {item.game.release_year}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
