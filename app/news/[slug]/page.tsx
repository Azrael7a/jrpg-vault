import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RelatedGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  release_year: number | null;
};

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  source_url: string | null;
  category: string | null;
  published_at: string | null;
  related_game: RelatedGame | RelatedGame[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function getCategoryLabel(category: string | null) {
  return category ?? "Actualité";
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("news")
    .select(
      `
      id,
      title,
      slug,
      summary,
      excerpt,
      content,
      image_url,
      source_url,
      category,
      published_at,
      related_game:games (
        id,
        title,
        slug,
        cover_url,
        release_year
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .single();

  if (error || !data) {
    notFound();
  }

  const news = data as unknown as NewsItem;
  const relatedGame = normalizeRelation(news.related_game);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-8">
          <Link href="/news" className="text-sm text-purple-300 underline">
            ← Retour aux actualités
          </Link>

          <div className="mt-8 max-w-5xl">
            <article>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                  {getCategoryLabel(news.category)}
                </span>

                <span className="text-sm text-slate-400">
                  {formatDate(news.published_at)}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
                {news.title}
              </h1>

              {(news.excerpt || news.summary) && (
                <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">
                  {news.excerpt ?? news.summary}
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-8 py-10 xl:grid-cols-[1fr_360px]">
        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
          {news.image_url && (
            <div className="aspect-[16/7] bg-slate-800">
              <img
                src={news.image_url}
                alt={`Image de l'actualité ${news.title}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {news.content ? (
              <div className="whitespace-pre-line leading-8 text-slate-300">
                {news.content}
              </div>
            ) : (
              <p className="leading-8 text-slate-300">
                {news.summary ?? "Aucun contenu détaillé pour cette actualité."}
              </p>
            )}

            {news.source_url && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-purple-300 underline underline-offset-4"
                >
                  Lire la source originale →
                </a>
              </div>
            )}
          </div>
        </article>

        <aside className="grid content-start gap-6">
          {relatedGame && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                Fiche jeu
              </p>

              <Link
                href={`/games/${relatedGame.slug}`}
                className="mt-4 block overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500"
              >
                <div className="aspect-[16/9] bg-slate-800">
                  {relatedGame.cover_url ? (
                    <img
                      src={relatedGame.cover_url}
                      alt={`Jaquette de ${relatedGame.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center font-semibold text-purple-300">
                      {relatedGame.title}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="font-semibold text-white">
                    {relatedGame.title}
                  </p>

                  {relatedGame.release_year && (
                    <p className="mt-1 text-sm text-slate-400">
                      {relatedGame.release_year}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-purple-300">
                    Voir la fiche →
                  </p>
                </div>
              </Link>
            </section>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Navigation
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/news"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Toutes les actualités
              </Link>

              <Link
                href="/games"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Catalogue des jeux
              </Link>

              <Link
                href="/releases"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Calendrier des sorties
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
