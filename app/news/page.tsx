import Link from "next/link";

import { getPublishedNews } from "@/lib/news/public-news";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default async function NewsPage() {
  const newsList = await getPublishedNews();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
          JRPG Vault
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Actualités JRPG
        </h1>

        <p className="mt-3 max-w-2xl text-zinc-400">
          Les dernières annonces, sorties, bandes-annonces
          et informations autour des JRPG.
        </p>
      </header>

      {newsList.length === 0 ? (
        <section className="mt-10 rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <h2 className="text-xl font-semibold">
            Aucune actualité publiée
          </h2>

          <p className="mt-2 text-zinc-400">
            Les prochaines actualités apparaîtront ici.
          </p>
        </section>
      ) : (
        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {news.category && (
                      <span className="font-semibold text-violet-400">
                        {news.category}
                      </span>
                    )}

                    <time
                      dateTime={news.published_at}
                      className="text-zinc-500"
                    >
                      {formatDate(news.published_at)}
                    </time>
                  </div>

                  <h2 className="mt-3 text-xl font-bold">
                    {news.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {description}
                  </p>

                  <Link
                    href={`/news/${news.slug}`}
                    className="mt-6 inline-flex font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Lire l’actualité →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
