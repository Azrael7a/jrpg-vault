import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import HomeReleasesSection from "@/components/home/HomeReleasesSection";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionItem = {
  id: number;
  game_id: number;
  status: CollectionStatus;
};

type NewsGame = {
  title: string;
  slug: string;
  cover_url: string | null;
};

type RawNewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published_at: string | null;
  related_game: NewsGame | NewsGame[] | null;
};

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published_at: string | null;
  related_game: NewsGame | null;
};

type ReleaseGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type ReleasePlatform = {
  id: number;
  name: string;
};

type RawRelease = {
  id: number;
  game_id: number;
  release_date: string | null;
  edition_name: string | null;
  region: string | null;
  games: ReleaseGame | ReleaseGame[] | null;
  platforms: ReleasePlatform | ReleasePlatform[] | null;
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

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { data: newsData } = await supabase
    .from("news")
    .select(
      `
      id,
      title,
      slug,
      summary,
      published_at,
      related_game:games (
        title,
        slug,
        cover_url
      )
    `
    )
    .order("published_at", { ascending: false })
    .limit(3);

  const { data: releasesData } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      game_id,
      release_date,
      edition_name,
      region,
      games (
        id,
        title,
        slug,
        cover_url
      ),
      platforms (
        id,
        name
      )
    `
    )
    .gte("release_date", today)
    .order("release_date", { ascending: true })
    .limit(24);

  let collectionItems: CollectionItem[] = [];

  if (user) {
    const { data } = await supabase
      .from("user_collections")
      .select("id, game_id, status")
      .eq("user_id", user.id);

    collectionItems = (data ?? []) as CollectionItem[];
  }

  const stats: Record<CollectionStatus, number> = {
    owned: 0,
    playing: 0,
    completed: 0,
    backlog: 0,
    wishlist: 0,
    preordered: 0,
    abandoned: 0,
  };

  for (const item of collectionItems) {
    stats[item.status] += 1;
  }

  const total = collectionItems.length;
  const followedGameIds = collectionItems.map((item) => item.game_id);

  const news: NewsItem[] = ((newsData ?? []) as RawNewsItem[]).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    published_at: item.published_at,
    related_game: normalizeRelation(item.related_game),
  }));

  const releases =
    ((releasesData ?? []) as RawRelease[]).map((release) => ({
      id: release.id,
      game_id: release.game_id,
      release_date: release.release_date,
      edition_name: release.edition_name,
      region: release.region,
      game: normalizeRelation(release.games),
      platform: normalizeRelation(release.platforms),
    })) ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto grid max-w-6xl gap-8 px-8 py-12 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                Actualités
              </p>
              <h1 className="mt-1 text-2xl font-bold">
                Dernières actualités JRPG
              </h1>
            </div>

            <Link href="/news" className="text-sm text-purple-300 underline">
              Tout voir
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {news.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                Aucune actualité n’est encore publiée.
              </div>
            ) : (
              news.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-purple-500 sm:grid-cols-[160px_1fr]"
                >
                  <div className="aspect-[16/9] overflow-hidden rounded bg-slate-800">
                    {item.related_game?.cover_url ? (
                      <img
                        src={item.related_game.cover_url}
                        alt={`Image liée à ${item.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                        JRPG Vault
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between gap-3">
                      <h2 className="font-semibold text-white">{item.title}</h2>

                      {item.published_at && (
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatDate(item.published_at)}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                      {item.summary}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                Collection
              </p>
              <h2 className="mt-1 text-2xl font-bold">Mon Vault</h2>
            </div>

            <Link
              href={user ? "/collection" : "/auth/login"}
              className="text-sm text-purple-300 underline"
            >
              {user ? "Voir ma collection" : "Connexion"}
            </Link>
          </div>

          {user ? (
            <>
              <p className="mt-4 text-slate-300">
                Bienvenue,{" "}
                <span className="font-semibold text-purple-300">
                  {user.email}
                </span>
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{total}</p>
                  <p className="mt-1 text-sm text-slate-400">Total</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{stats.completed}</p>
                  <p className="mt-1 text-sm text-slate-400">Terminés</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{stats.playing}</p>
                  <p className="mt-1 text-sm text-slate-400">En cours</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{stats.backlog}</p>
                  <p className="mt-1 text-sm text-slate-400">Backlog</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{stats.wishlist}</p>
                  <p className="mt-1 text-sm text-slate-400">Wishlist</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold">{stats.preordered}</p>
                  <p className="mt-1 text-sm text-slate-400">Précommandés</p>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6">
              <p className="text-slate-300">
                Connecte-toi pour voir le résumé de ta collection JRPG :
                backlog, jeux terminés, wishlist et précommandes.
              </p>

              <Link
                href="/auth/login"
                className="mt-5 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </section>

      <HomeReleasesSection
        releases={releases}
        followedGameIds={followedGameIds}
        isLoggedIn={Boolean(user)}
      />
    </main>
  );
}
