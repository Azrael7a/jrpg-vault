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

type RawNews = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string | null;
  source_url: string | null;
  published_at: string;
  related_game: RelatedGame;
};

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      summary,
      content,
      source_url,
      published_at,
      related_game:games (
        title,
        slug
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>Actualité introuvable.</p>
      </main>
    );
  }

  const news = data as unknown as RawNews;
  const relatedGame = Array.isArray(news.related_game)
    ? news.related_game[0]
    : news.related_game;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/news" className="text-sm text-gray-600 hover:underline">
        ← Retour aux actualités
      </Link>

      <article className="mt-6">
        <h1 className="text-3xl font-bold">{news.title}</h1>

        <p className="mt-2 text-sm text-gray-500">
          Publié le : {new Date(news.published_at).toLocaleDateString("fr-FR")}
        </p>

        {relatedGame && (
          <p className="mt-2 text-sm text-gray-600">
            Jeu lié :{" "}
            <Link href={`/games/${relatedGame.slug}`} className="underline">
              {relatedGame.title}
            </Link>
          </p>
        )}

        <p className="mt-6 text-lg text-gray-700">{news.summary}</p>

        <div className="mt-6 whitespace-pre-line leading-7 text-gray-800">
          {news.content}
        </div>

        {news.source_url && (
          <p className="mt-8">
            <a
              href={news.source_url}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Voir la source
            </a>
          </p>
        )}
      </article>
    </main>
  );
}
