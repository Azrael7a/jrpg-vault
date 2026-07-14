import Link from "next/link";

import { getPublishedNews } from "@/lib/news/public-news";

export default async function LatestNews() {
  const newsList = await getPublishedNews(3);

  if (newsList.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Actualités
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Les dernières news JRPG
          </h2>
        </div>

        <Link
          href="/news"
          className="hidden font-semibold text-violet-400 hover:text-violet-300 sm:inline-flex"
        >
          Toutes les actualités →
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {newsList.map((news) => {
          const description =
            news.excerpt ??
            news.summary ??
            "";

          return (
            <article
              key={news.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
            >
              {news.image_url && (
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="aspect-video w-full object-cover"
                />
              )}

              <div className="p-5">
                {news.category && (
                  <p className="text-sm font-semibold text-violet-400">
                    {news.category}
                  </p>
                )}

                <h3 className="mt-2 text-lg font-bold">
                  {news.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                  {description}
                </p>

                <Link
                  href={`/news/${news.slug}`}
                  className="mt-5 inline-flex text-sm font-semibold text-violet-400 hover:text-violet-300"
                >
                  Lire la suite →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href="/news"
        className="mt-6 inline-flex font-semibold text-violet-400 sm:hidden"
      >
        Toutes les actualités →
      </Link>
    </section>
  );
}
