import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedNewsBySlug } from "@/lib/news/public-news";

type NewsArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
  const { slug } = await params;
  const news = await getPublishedNewsBySlug(slug);

  if (!news) {
    notFound();
  }

  const description =
    news.excerpt ??
    news.summary ??
    "";

  const formattedDate =
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(news.published_at));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/news"
        className="text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ← Toutes les actualités
      </Link>

      <article className="mt-8">
        <header>
          {news.category && (
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
              {news.category}
            </p>
          )}

          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            {news.title}
          </h1>

          <time
            dateTime={news.published_at}
            className="mt-5 block text-sm text-zinc-500"
          >
            Publié le {formattedDate}
          </time>
        </header>

        {news.image_url && (
          <img
            src={news.image_url}
            alt={news.title}
            className="mt-8 aspect-video w-full rounded-2xl object-cover"
          />
        )}

        {description && (
          <p className="mt-8 text-xl font-medium leading-8 text-zinc-200">
            {description}
          </p>
        )}

        <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-zinc-300">
          {news.content}
        </div>

        {(news.source_name || news.source_url) && (
          <footer className="mt-12 border-t border-white/10 pt-6">
            <p className="text-sm text-zinc-500">
              Source :{" "}
              {news.source_url ? (
                <a
                  href={news.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-400 hover:text-violet-300"
                >
                  {news.source_name ?? "Lien original"}
                </a>
              ) : (
                news.source_name
              )}
            </p>
          </footer>
        )}
      </article>
    </main>
  );
}
