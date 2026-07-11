import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

type RelatedGame =
  | {
      title: string;
      slug: string;
    }
  | {
      title: string;
      slug: string;
    }[]
  | null;

type RawNewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published_at: string;
  related_game: RelatedGame;
};

export default async function NewsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      summary,
      published_at,
      related_game:games (
        title,
        slug
      )
    `)
    .order("published_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Actualités JRPG</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const newsItems = (data ?? []) as unknown as RawNewsItem[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Actualités JRPG</h1>

      <p className="mt-2 text-gray-600">
        Les dernières annonces, sorties et informations autour des JRPG.
      </p>

      <div className="mt-6 grid gap-4">
        {newsItems.length === 0 && (
          <div className="rounded-xl border p-4">
            Aucune actualité pour le moment.
          </div>
        )}

        {newsItems.map((item) => {
          const relatedGame = Array.isArray(item.related_game)
            ? item.related_game[0]
            : item.related_game;

          return (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="rounded-xl border p-4 hover:bg-gray-50"
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>

              <p className="mt-2 text-gray-700">{item.summary}</p>

              <div className="mt-3 text-sm text-gray-500">
                <p>
                  Publié le :{" "}
                  {new Date(item.published_at).toLocaleDateString("fr-FR")}
                </p>

                {relatedGame && <p>Jeu lié : {relatedGame.title}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
