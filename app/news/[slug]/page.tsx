import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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
  status: string | null;
  legacy_game_id: number | null;
};

type RelatedNewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
};

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
};

type NewsGameIdRow = {
  game_id: number | null;
};

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNewsRecord(record: Record<string, unknown>): NewsItem | null {
  const id = toNullableNumber(record.id);
  const title = toNullableString(record.title);
  const slug = toNullableString(record.slug);

  if (id === null || !title || !slug) {
    return null;
  }

  return {
    id,
    title,
    slug,
    summary: toNullableString(record.summary),
    excerpt: toNullableString(record.excerpt),
    content:
      toNullableString(record.content) ??
      toNullableString(record.body) ??
      toNullableString(record.article_body),
    image_url:
      toNullableString(record.image_url) ??
      toNullableString(record.hero_image_url),
    source_url: toNullableString(record.source_url),
    category: toNullableString(record.category),
    published_at: toNullableString(record.published_at),
    status: toNullableString(record.status),
    legacy_game_id:
      toNullableNumber(record.related_game_id) ??
      toNullableNumber(record.related_game),
  };
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getReadingTime(...texts: Array<string | null>) {
  const wordCount = texts
    .filter((text): text is string => Boolean(text?.trim()))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 220));
}

function getIntroduction(news: NewsItem) {
  return news.summary?.trim() || news.excerpt?.trim() || null;
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function splitMediaPayload(payload: string) {
  const separatorIndex = payload.indexOf("|");

  if (separatorIndex === -1) {
    return {
      url: payload.trim(),
      caption: null,
    };
  }

  const url = payload.slice(0, separatorIndex).trim();
  const caption = payload.slice(separatorIndex + 1).trim();

  return {
    url,
    caption: caption.length > 0 ? caption : null,
  };
}

function getYouTubeVideoId(value: string) {
  const trimmedValue = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      const watchVideoId = url.searchParams.get("v");

      if (watchVideoId && /^[a-zA-Z0-9_-]{11}$/.test(watchVideoId)) {
        return watchVideoId;
      }

      const pathParts = url.pathname.split("/").filter(Boolean);

      if (
        pathParts[0] === "embed" ||
        pathParts[0] === "shorts" ||
        pathParts[0] === "live"
      ) {
        const videoId = pathParts[1];
        return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(value: string) {
  const videoId = getYouTubeVideoId(value);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

function renderInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function renderMediaBlock(block: string, index: number) {
  const imageMatch = block.match(/^\[image:([\s\S]+)\]$/i);

  if (imageMatch) {
    const { url, caption } = splitMediaPayload(imageMatch[1]);

    if (!isSafeHttpUrl(url)) {
      return (
        <p
          key={`invalid-image-${index}`}
          className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200"
        >
          Image non affichée : URL invalide.
        </p>
      );
    }

    return (
      <figure
        key={`image-${index}-${url}`}
        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
      >
        <img
          src={url}
          alt={caption ?? "Image intégrée à l'article"}
          className="max-h-[560px] w-full object-cover"
        />

        {caption && (
          <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  const youtubeMatch = block.match(/^\[(youtube|video):([\s\S]+)\]$/i);

  if (youtubeMatch) {
    const { url, caption } = splitMediaPayload(youtubeMatch[2]);
    const embedUrl = getYouTubeEmbedUrl(url);

    if (!embedUrl) {
      return (
        <p
          key={`invalid-youtube-${index}`}
          className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200"
        >
          Vidéo YouTube non affichée : URL invalide.
        </p>
      );
    }

    return (
      <figure
        key={`youtube-${index}-${embedUrl}`}
        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
      >
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={caption ?? "Vidéo YouTube intégrée"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {caption && (
          <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-400">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}

function renderArticleContent(content: string): ReactNode[] {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const mediaBlock = renderMediaBlock(block, index);

    if (mediaBlock) {
      return mediaBlock;
    }

    if (block.startsWith("### ")) {
      return (
        <h3
          key={`${index}-${block}`}
          className="pt-2 text-xl font-bold leading-tight text-white sm:text-2xl"
        >
          {block.slice(4).trim()}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2
          key={`${index}-${block}`}
          className="pt-5 text-2xl font-bold leading-tight text-white sm:text-3xl"
        >
          {block.slice(3).trim()}
        </h2>
      );
    }

    if (block.startsWith("> ")) {
      return (
        <blockquote
          key={`${index}-${block}`}
          className="border-l-2 border-violet-400 pl-5 text-lg italic leading-8 text-slate-300"
        >
          {renderInlineText(block.slice(2).trim())}
        </blockquote>
      );
    }

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
      return (
        <ul
          key={`${index}-${block}`}
          className="list-disc space-y-2 pl-6 text-base leading-8 text-slate-300 sm:text-lg"
        >
          {lines.map((line) => (
            <li key={line}>{renderInlineText(line.slice(2).trim())}</li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={`${index}-${block}`}
        className="whitespace-pre-line text-base leading-8 text-slate-300 sm:text-lg sm:leading-9"
      >
        {renderInlineText(block)}
      </p>
    );
  });
}

async function getPublishedNews(slug: string): Promise<NewsItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erreur Supabase pendant le chargement de la news :", {
      slug,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error(`Impossible de charger l’actualité : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const news = normalizeNewsRecord(data as Record<string, unknown>);

  if (!news) {
    throw new Error("L’actualité trouvée possède des données incomplètes.");
  }

  if (news.status && news.status !== "published") {
    return null;
  }

  if (
    news.published_at &&
    new Date(news.published_at).getTime() > Date.now()
  ) {
    return null;
  }

  return news;
}

async function getLinkedGames(news: NewsItem): Promise<GameRelation[]> {
  const supabase = await createClient();
  const gameIds = new Set<number>();

  if (news.legacy_game_id !== null) {
    gameIds.add(news.legacy_game_id);
  }

  const { data: linkData, error: linkError } = await supabase
    .from("news_games")
    .select("game_id")
    .eq("news_id", news.id);

  if (linkError) {
    console.warn(
      "Impossible de charger news_games. L’ancien lien related_game_id reste utilisable :",
      linkError.message,
    );
  } else {
    for (const row of (linkData ?? []) as unknown as NewsGameIdRow[]) {
      if (typeof row.game_id === "number") {
        gameIds.add(row.game_id);
      }
    }
  }

  if (gameIds.size === 0) {
    return [];
  }

  const { data: gamesData, error: gamesError } = await supabase
    .from("games")
    .select(
      "id, title, slug, series, release_year, cover_url, developer, publisher",
    )
    .in("id", Array.from(gameIds));

  if (gamesError) {
    console.error(
      "Erreur pendant le chargement des jeux liés à la news :",
      gamesError,
    );
    return [];
  }

  return ((gamesData ?? []) as unknown as GameRelation[]).sort((a, b) =>
    a.title.localeCompare(b.title, "fr"),
  );
}

async function getRelatedNews(newsId: number): Promise<RelatedNewsItem[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("news")
    .select(
      "id, title, slug, summary, excerpt, image_url, category, published_at",
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .neq("id", newsId)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error(
      "Erreur pendant le chargement des actualités similaires :",
      error,
    );
    return [];
  }

  return (data ?? []) as unknown as RelatedNewsItem[];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getPublishedNews(slug);

  if (!news) {
    return {
      title: "Actualité introuvable | JRPG Vault",
    };
  }

  const description =
    news.summary?.trim() ||
    news.excerpt?.trim() ||
    `Retrouve cette actualité JRPG sur JRPG Vault : ${news.title}`;

  return {
    title: `${news.title} | JRPG Vault`,
    description,
    openGraph: {
      title: news.title,
      description,
      type: "article",
      publishedTime: news.published_at ?? undefined,
      images: news.image_url
        ? [
            {
              url: news.image_url,
              alt: news.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const news = await getPublishedNews(slug);

  if (!news) {
    notFound();
  }

  const [linkedGames, relatedNews] = await Promise.all([
    getLinkedGames(news),
    getRelatedNews(news.id),
  ]);

  const introduction = getIntroduction(news);
  const readingTime = getReadingTime(news.summary, news.excerpt, news.content);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/news"
          className="text-sm font-medium text-slate-400 transition hover:text-violet-300"
        >
          ← Retour aux actualités
        </Link>

        <header className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="rounded-full bg-violet-500/15 px-3 py-1 font-semibold uppercase tracking-wide text-violet-300">
              {news.category?.trim() || "Actualité"}
            </span>

            <time dateTime={news.published_at ?? undefined}>
              {formatDate(news.published_at)}
            </time>

            <span aria-hidden="true">•</span>

            <span>{readingTime} min de lecture</span>
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {news.title}
          </h1>

          {introduction && (
            <p className="mt-5 text-lg leading-8 text-slate-300 sm:text-xl">
              {introduction}
            </p>
          )}
        </header>

        {news.image_url && (
          <figure className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
            <img
              src={news.image_url}
              alt={`Illustration de l’actualité : ${news.title}`}
              className="max-h-[440px] w-full object-cover"
            />
          </figure>
        )}

        <div className="mx-auto mt-10 max-w-3xl">
          {news.content?.trim() ? (
            <div className="space-y-6">
              {renderArticleContent(news.content)}
            </div>
          ) : (
            <p className="text-slate-400">
              Le contenu complet de cette actualité n’est pas encore disponible.
            </p>
          )}

          {news.source_url && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <a
                href={news.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-violet-300 underline underline-offset-4 hover:text-violet-200"
              >
                Lire la source originale →
              </a>
            </div>
          )}
        </div>

        {linkedGames.length > 0 && (
          <section className="mx-auto mt-12 max-w-3xl border-t border-white/10 pt-8">
            <h2 className="text-xl font-bold text-white">
              {linkedGames.length === 1 ? "Jeu associé" : "Jeux associés"}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {linkedGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="flex gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-violet-400/40 hover:bg-slate-900"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={`Jaquette de ${game.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500">
                        Pas de jaquette
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold leading-snug text-white">
                      {game.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {[game.series, game.release_year]
                        .filter(Boolean)
                        .join(" · ") || "Fiche du catalogue"}
                    </p>

                    <span className="mt-3 inline-flex text-sm font-semibold text-violet-300">
                      Voir la fiche →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {relatedNews.length > 0 && (
          <section className="mx-auto mt-12 max-w-3xl border-t border-white/10 pt-8">
            <h2 className="text-xl font-bold text-white">À lire ensuite</h2>

            <div className="mt-4 divide-y divide-white/10">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="block py-4 transition hover:text-violet-200"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wide text-violet-300">
                      {item.category?.trim() || "Actualité"}
                    </span>
                    <span aria-hidden="true">•</span>
                    <time>{formatDate(item.published_at)}</time>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-slate-100">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
