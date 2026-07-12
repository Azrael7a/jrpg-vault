import Link from "next/link";

type NewsGame = {
  title: string;
  slug: string;
  cover_url: string | null;
} | null;

type HomeNewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published_at: string | null;
  related_game: NewsGame;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function NewsImage({
  coverUrl,
  title,
  compact = false,
}: {
  coverUrl: string | null | undefined;
  title: string;
  compact?: boolean;
}) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Image liée à ${title}`}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
      <span className={compact ? "text-xs" : "text-sm"}>JRPG Vault</span>
    </div>
  );
}

export default function HomeLatestNews({ news }: { news: HomeNewsItem[] }) {
  const [featuredNews, ...secondaryNews] = news;
  const displayedSecondaryNews = secondaryNews.slice(0, 4);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Actualités
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Dernières actualités JRPG
          </h1>
        </div>

        <Link href="/news" className="text-sm text-purple-300 underline">
          Tout voir
        </Link>
      </div>

      {news.length === 0 && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
          Aucune actualité n’est encore publiée.
        </div>
      )}

      {featuredNews && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Link
            href={`/news/${featuredNews.slug}`}
            className="group relative block min-h-[360px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 hover:border-purple-500"
          >
            <NewsImage
              coverUrl={featuredNews.related_game?.cover_url}
              title={featuredNews.title}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold uppercase text-white">
                  News JRPG
                </span>

                <span className="text-xs text-slate-300">
                  {formatDate(featuredNews.published_at)}
                </span>
              </div>

              <h2 className="max-w-3xl text-2xl font-bold leading-tight text-white">
                {featuredNews.title}
              </h2>

              <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-slate-300">
                {featuredNews.summary}
              </p>
            </div>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            {displayedSecondaryNews.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group relative min-h-[170px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500"
              >
                <NewsImage
                  coverUrl={item.related_game?.cover_url}
                  title={item.title}
                  compact
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                      News jeu
                    </span>

                    <span className="text-xs text-slate-300">
                      {formatDate(item.published_at)}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 font-semibold leading-snug text-white">
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                    {item.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
