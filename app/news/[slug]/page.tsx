import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: news, error } = await supabase
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

  if (error || !news) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>Actualité introuvable.</p>
      </main>
    );
  }

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

        {news.related_game && (
          <p className="mt-2 text-sm text-gray-600">
            Jeu lié :{" "}
            <Link
              href={`/games/${news.related_game.slug}`}
              className="underline"
            >
              {news.related_game.title}
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
