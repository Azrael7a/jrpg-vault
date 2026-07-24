import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddToCollectionButton from "./AddToCollectionButton";
import FollowGameButton from "./FollowGameButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Tag = {
  id: number;
  name: string;
};

type TagRelation = {
  tags: Tag | Tag[] | null;
};

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type ReleaseRelation = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  platforms: Platform | Platform[] | null;
};

type Game = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  series: string | null;
  cover_url: string | null;
  release_year: number | null;
  game_tags: TagRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

type CollectionEntry = {
  id: number;
  status: string | null;
  format: string | null;
  region: string | null;
  platforms: Platform | Platform[] | null;
};

type RelatedNews = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string | null;
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

function formatStatus(status: string | null) {
  switch (status) {
    case "released":
      return "Sorti";
    case "confirmed":
      return "Confirmé";
    case "rumor":
      return "Rumeur";
    case "delayed":
      return "Repoussé";
    default:
      return "Statut inconnu";
  }
}

function getStatusClass(status: string | null) {
  switch (status) {
    case "released":
      return "border-slate-600 bg-slate-800 text-slate-200";
    case "confirmed":
      return "border-green-500/40 bg-green-950/70 text-green-200";
    case "rumor":
      return "border-yellow-500/40 bg-yellow-950/70 text-yellow-200";
    case "delayed":
      return "border-orange-500/40 bg-orange-950/70 text-orange-200";
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function formatCollectionStatus(status: string | null) {
  switch (status) {
    case "owned":
      return "Possédé";
    case "playing":
      return "En cours";
    case "completed":
      return "Terminé";
    case "backlog":
      return "Backlog";
    case "wishlist":
      return "Wishlist";
    case "preordered":
      return "Précommandé";
    case "abandoned":
      return "Abandonné";
    default:
      return "Statut inconnu";
  }
}

function formatCollectionFormat(format: string | null) {
  switch (format) {
    case "physical":
      return "Physique";
    case "digital":
      return "Numérique";
    case "both":
      return "Physique + numérique";
    default:
      return "Format inconnu";
  }
}

function formatReleaseFormat(physical: boolean | null, digital: boolean | null) {
  if (physical && digital) {
    return "Physique + numérique";
  }

  if (physical) {
    return "Physique";
  }

  if (digital) {
    return "Numérique";
  }

  return "Format inconnu";
}

function normalizePlatformName(name: string) {
  return name.toLowerCase().trim();
}

function isPlayStationPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5") ||
    normalizedName.includes("playstation")
  );
}

function isSwitchPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName === "switch" ||
    normalizedName === "nintendo switch" ||
    normalizedName.includes("switch 2") ||
    normalizedName.includes("switch2")
  );
}

function isXboxPlatform(name: string) {
  return normalizePlatformName(name).includes("xbox");
}

function isPcPlatform(name: string) {
  const normalizedName = normalizePlatformName(name);

  return (
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  );
}

function getPlatformTagClass(platformName: string) {
  if (isSwitchPlatform(platformName)) {
    return "border-[#E60012] bg-[#E60012] text-white";
  }

  if (isPlayStationPlatform(platformName)) {
    return "border-[#0070CC] bg-[#0070CC] text-white";
  }

  if (isXboxPlatform(platformName)) {
    return "border-[#107C10] bg-[#107C10] text-white";
  }

  if (isPcPlatform(platformName)) {
    return "border-black bg-black text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getNewsText(news: RelatedNews) {
  return news.excerpt ?? news.summary ?? "Aucun résumé disponible.";
}

function getCategoryLabel(category: string | null) {
  return category ?? "Actualité";
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      slug,
      description,
      developer,
      publisher,
      series,
      cover_url,
      release_year,
      game_tags (
        tags (
          id,
          name
        )
      ),
      game_releases (
        id,
        region,
        release_date,
        physical,
        digital,
        status,
        edition_name,
        platforms (
          id,
          name,
          manufacturer
        )
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const game = data as unknown as Game;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowed = false;

  let collectionEntries: {
    id: number;
    status: string | null;
    format: string | null;
    region: string | null;
    platform: Platform | null;
  }[] = [];

  if (user) {
    const [{ data: followedGame }, { data: collectionData }] =
      await Promise.all([
        supabase
          .from("user_followed_games")
          .select("id")
          .eq("user_id", user.id)
          .eq("game_id", game.id)
          .maybeSingle(),

        supabase
          .from("user_collections")
          .select(
            `
            id,
            status,
            format,
            region,
            platforms (
              id,
              name,
              manufacturer
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("game_id", game.id),
      ]);

    isFollowed = Boolean(followedGame);

    collectionEntries = ((collectionData ?? []) as unknown as CollectionEntry[])
      .map((item) => ({
        id: item.id,
        status: item.status,
        format: item.format,
        region: item.region,
        platform: normalizeRelation(item.platforms),
      }))
      .filter((item) => item.platform);
  }

  const now = new Date().toISOString();

  const { data: relatedNewsData } = await supabase
    .from("news")
    .select(
      `
      id,
      title,
      slug,
      summary,
      excerpt,
      image_url,
      category,
      published_at
    `,
    )
    .eq("related_game_id", game.id)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("published_at", { ascending: false })
    .limit(3);

  const relatedNews = (relatedNewsData ?? []) as RelatedNews[];

  const tags =
    game.game_tags
      ?.map((relation) => normalizeRelation(relation.tags))
      .filter((tag): tag is Tag => Boolean(tag)) ?? [];

  const releases =
    game.game_releases
      ?.map((release) => ({
        ...release,
        platform: normalizeRelation(release.platforms),
      }))
      .filter((release) => release.platform)
      .sort((a, b) => {
        const dateA = a.release_date ?? "9999-12-31";
        const dateB = b.release_date ?? "9999-12-31";

        return dateA.localeCompare(dateB);
      }) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-8">
          <Link href="/games" className="text-sm text-purple-300 underline">
            ← Retour au catalogue
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
            <div>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={`Jaquette de ${game.title}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center px-6 text-center text-xl font-bold text-purple-300">
                    {game.title}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <AddToCollectionButton gameId={game.id} />

                <FollowGameButton
                  gameId={game.id}
                  initialIsFollowed={isFollowed}
                />
              </div>
            </div>

            <div className="flex flex-col justify-start pt-2">
              {game.series && (
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                  {game.series}
                </p>
              )}

              <h1 className="mt-2 max-w-5xl text-5xl font-bold leading-tight text-white">
                {game.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                {game.release_year && (
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200">
                    {game.release_year}
                  </span>
                )}

                {game.developer && (
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200">
                    Développeur : {game.developer}
                  </span>
                )}

                {game.publisher && (
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200">
                    Éditeur : {game.publisher}
                  </span>
                )}
              </div>

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-1 text-sm text-purple-200"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {releases.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                    Disponible sur
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {releases.map((release) => (
                      <div
                        key={release.id}
                        className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                              release.platform?.name ?? "",
                            )}`}
                          >
                            {release.platform?.name ?? "Plateforme inconnue"}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatStatus(release.status)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-300">
                          Sortie :{" "}
                          <span className="font-semibold text-white">
                            {formatDate(release.release_date)}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {release.region ?? "Région inconnue"} ·{" "}
                          {formatReleaseFormat(
                            release.physical,
                            release.digital,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 max-w-4xl">
                <h2 className="text-xl font-bold text-white">Description</h2>

                {game.description ? (
                  <p className="mt-3 leading-7 text-slate-300">
                    {game.description}
                  </p>
                ) : (
                  <p className="mt-3 text-slate-400">
                    Aucune description n’est encore renseignée pour ce jeu.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-8 py-10 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                  Calendrier
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  Sorties référencées
                </h2>
              </div>

              <Link href="/releases" className="text-sm text-purple-300 underline">
                Voir le calendrier →
              </Link>
            </div>

            {releases.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                Aucune sortie n’est encore renseignée pour ce jeu.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {releases.map((release) => (
                  <div
                    key={release.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                            release.platform?.name ?? "",
                          )}`}
                        >
                          {release.platform?.name ?? "Plateforme inconnue"}
                        </span>

                        <p className="mt-4 text-xl font-bold text-white">
                          {formatDate(release.release_date)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          release.status,
                        )}`}
                      >
                        {formatStatus(release.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-2 text-sm text-slate-400">
                      <div className="flex justify-between gap-3">
                        <span>Région</span>
                        <span className="text-slate-200">
                          {release.region ?? "Inconnue"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Format</span>
                        <span className="text-slate-200">
                          {formatReleaseFormat(
                            release.physical,
                            release.digital,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Édition</span>
                        <span className="text-slate-200">
                          {release.edition_name ?? "Standard"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                  Actualités
                </p>

                <h2 className="mt-1 text-2xl font-bold text-white">
                  News liées au jeu
                </h2>
              </div>

              <Link href="/news" className="text-sm text-purple-300 underline">
                Toutes les news →
              </Link>
            </div>

            {relatedNews.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                Aucune actualité liée à ce jeu pour le moment.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 hover:border-purple-500"
                  >
                    <div className="relative aspect-[16/9] bg-slate-800">
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt={`Image de ${news.title}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-purple-300">
                          JRPG Vault
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>

                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-purple-600 px-2 py-1 text-[10px] font-semibold uppercase text-white">
                          {getCategoryLabel(news.category)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatDate(news.published_at)}
                        </span>
                      </div>

                      <h3 className="mt-3 line-clamp-2 font-semibold text-white">
                        {news.title}
                      </h3>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {getNewsText(news)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="grid gap-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Mon Vault
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Dans ma collection
            </h2>

            {!user ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-sm text-slate-400">
                  Connecte-toi pour voir ton statut sur ce jeu.
                </p>

                <Link
                  href="/auth/login"
                  className="mt-4 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
                >
                  Se connecter
                </Link>
              </div>
            ) : collectionEntries.length === 0 ? (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                Ce jeu n’est pas encore dans ta collection.
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                {collectionEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                          entry.platform?.name ?? "",
                        )}`}
                      >
                        {entry.platform?.name ?? "Plateforme inconnue"}
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {formatCollectionStatus(entry.status)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      {formatCollectionFormat(entry.format)}
                      {entry.region ? ` · ${entry.region}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Liens rapides
            </p>

            <div className="mt-4 grid gap-3">
              <Link
                href="/games"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Explorer le catalogue
              </Link>

              <Link
                href="/collection"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Voir ma collection
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
