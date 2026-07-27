import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameHero, { type GameCoverOption } from "./GameHero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Region = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";

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

type GamePlatformRelation = {
  id: number;
  platform_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  edition_name: string | null;
  cover_url: string | null;
  platforms: Platform | Platform[] | null;
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
  game_platforms: GamePlatformRelation[] | null;
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

const validRegions: Region[] = ["PAL", "US", "JAP", "ASIA", "WORLD"];

function isRegion(value: string | null): value is Region {
  return Boolean(value && validRegions.includes(value as Region));
}

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

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function getPlatformTagClass(platformName: string) {
  const normalizedName = normalizePlatformName(platformName);

  if (
    normalizedName === "switch" ||
    normalizedName === "nintendo switch" ||
    normalizedName.includes("switch 2") ||
    normalizedName.includes("switch2")
  ) {
    return "border-[#E60012] bg-[#E60012] text-white";
  }

  if (
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5") ||
    normalizedName.includes("playstation")
  ) {
    return "border-[#0070CC] bg-[#0070CC] text-white";
  }

  if (normalizedName.includes("xbox")) {
    return "border-[#107C10] bg-[#107C10] text-white";
  }

  if (
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  ) {
    return "border-black bg-black text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getNewsText(news: RelatedNews) {
  return news.excerpt ?? news.summary ?? "Aucun résumé disponible.";
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
        game_platforms (
          id,
          platform_id,
          region,
          release_date,
          physical,
          digital,
          edition_name,
          cover_url,
          platforms (
            id,
            name,
            manufacturer
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

  const gamePlatforms =
    game.game_platforms
      ?.map((version) => ({
        ...version,
        platform: normalizeRelation(version.platforms),
      }))
      .filter((version) => version.platform) ?? [];

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

  const coverOptions: GameCoverOption[] = gamePlatforms
    .filter(
      (version) =>
        Boolean(version.cover_url) &&
        Boolean(version.platform) &&
        isRegion(version.region),
    )
    .map((version) => ({
      key: `${version.id}:${version.region}`,
      platformId: version.platform_id,
      platformName: version.platform?.name ?? "Plateforme",
      region: version.region as Region,
      coverUrl: version.cover_url as string,
    }))
    .sort((a, b) =>
      `${a.platformName}:${a.region}`.localeCompare(
        `${b.platformName}:${b.region}`,
        "fr",
      ),
    );

  const platformNames = Array.from(
    new Set(
      [
        ...gamePlatforms.map((version) => version.platform?.name),
        ...releases.map((release) => release.platform?.name),
      ].filter((name): name is string => Boolean(name)),
    ),
  );

  const firstReleaseDate = [
    ...gamePlatforms.map((version) => version.release_date),
    ...releases.map((release) => release.release_date),
  ]
    .filter((date): date is string => Boolean(date))
    .sort()[0] ?? null;

  const defaultCoverUrl = game.cover_url ?? coverOptions[0]?.coverUrl ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <GameHero
        gameId={game.id}
        title={game.title}
        series={game.series}
        description={game.description}
        developer={game.developer}
        publisher={game.publisher}
        releaseYear={game.release_year}
        firstReleaseDate={firstReleaseDate}
        defaultCoverUrl={defaultCoverUrl}
        coverOptions={coverOptions}
        tags={tags}
        platformNames={platformNames}
        initialIsFollowed={isFollowed}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-8">
          {game.description && (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                Présentation
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                À propos de {game.title}
              </h2>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-300">
                {game.description}
              </p>
            </article>
          )}

          {releases.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                    Disponibilité
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Sorties référencées
                  </h2>
                </div>
                <Link href="/releases" className="text-sm text-purple-300 hover:text-purple-200">
                  Voir le calendrier →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {releases.map((release) => (
                  <div
                    key={release.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/75 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                          release.platform?.name ?? "",
                        )}`}
                      >
                        {release.platform?.name ?? "Plateforme inconnue"}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          release.status,
                        )}`}
                      >
                        {formatStatus(release.status)}
                      </span>
                    </div>

                    <p className="mt-4 text-xl font-bold text-white">
                      {formatDate(release.release_date)}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {release.region ?? "Région inconnue"} ·{" "}
                      {formatReleaseFormat(release.physical, release.digital)}
                    </p>
                    {release.edition_name && (
                      <p className="mt-1 text-sm text-slate-500">
                        Édition {release.edition_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedNews.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                    Actualités
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    News liées au jeu
                  </h2>
                </div>
                <Link href="/news" className="text-sm text-purple-300 hover:text-purple-200">
                  Toutes les news →
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedNews.map((news) => (
                  <Link
                    key={news.id}
                    href={`/news/${news.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950/75 transition hover:border-purple-500"
                  >
                    <div className="relative aspect-video bg-slate-800">
                      {news.image_url ? (
                        <img
                          src={news.image_url}
                          alt={`Image de ${news.title}`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-purple-300">
                          JRPG Vault
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-purple-300">
                        {news.category ?? "Actualité"} · {formatDate(news.published_at)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 font-bold text-white">
                        {news.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {getNewsText(news)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="grid content-start gap-6">
          {collectionEntries.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
                Mon Vault
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                Dans ma collection
              </h2>

              <div className="mt-5 grid gap-3">
                {collectionEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/75 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-medium ${getPlatformTagClass(
                          entry.platform?.name ?? "",
                        )}`}
                      >
                        {entry.platform?.name ?? "Plateforme inconnue"}
                      </span>
                      <span className="text-sm font-bold text-white">
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
            </section>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-400">
              Continuer
            </p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/games"
                className="rounded-xl border border-slate-800 bg-slate-950/75 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-purple-500"
              >
                Explorer le catalogue
              </Link>
              <Link
                href="/collection"
                className="rounded-xl border border-slate-800 bg-slate-950/75 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-purple-500"
              >
                Voir ma collection
              </Link>
              <Link
                href="/releases"
                className="rounded-xl border border-slate-800 bg-slate-950/75 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-purple-500"
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
