import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import HomeLatestNews from "@/components/home/HomeLatestNews";
import HomeReleasesSection from "@/components/home/HomeReleasesSection";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type CollectionPlatform = {
  id: number;
  name: string;
};

type RawCollectionItem = {
  id: number;
  game_id: number;
  status: CollectionStatus;
  created_at: string | null;
  games: CollectionGame | CollectionGame[] | null;
  platforms: CollectionPlatform | CollectionPlatform[] | null;
};

type CollectionItem = {
  id: number;
  game_id: number;
  status: CollectionStatus;
  created_at: string | null;
  game: CollectionGame | null;
  platform: CollectionPlatform | null;
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

function getStatusLabel(status: CollectionStatus) {
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
  }
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
    .limit(5);

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
      .select(
        `
        id,
        game_id,
        status,
        created_at,
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    collectionItems = ((data ?? []) as RawCollectionItem[]).map((item) => ({
      id: item.id,
      game_id: item.game_id,
      status: item.status,
      created_at: item.created_at,
      game: normalizeRelation(item.games),
      platform: normalizeRelation(item.platforms),
    }));
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
  const recentCollectionItems = collectionItems.slice(0, 3);
  const completionRate =
    total > 0 ? Math.round((stats.completed / total) * 100) : 0;

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
      <section className="mx-auto grid max-w-7xl items-start gap-8 px-8 py-12 lg:grid-cols-[1.35fr_1fr]">
        <HomeLatestNews news={news} />

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
                Collection
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">Mon Vault</h2>
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
                Résumé de ta collection JRPG personnelle.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold text-white">{total}</p>
                  <p className="mt-1 text-sm text-slate-400">Total</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold text-white">
                    {stats.completed}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Terminés</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-3xl font-bold text-white">
                    {stats.playing}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">En cours</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-200">
                    Progression globale
                  </span>
                  <span className="text-purple-300">{completionRate}%</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <span>Backlog : {stats.backlog}</span>
                  <span>Wishlist : {stats.wishlist}</span>
                  <span>Préco : {stats.preordered}</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-white">Derniers ajouts</h3>

                  <Link
                    href="/collection"
                    className="text-xs text-purple-300 underline"
                  >
                    Gérer
                  </Link>
                </div>

                <div className="mt-3 grid gap-3">
                  {recentCollectionItems.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                      Ta collection est encore vide. Ajoute ton premier JRPG
                      depuis le catalogue.
                    </div>
                  ) : (
                    recentCollectionItems.map((item) => (
                      <Link
                        key={item.id}
                        href={
                          item.game ? `/games/${item.game.slug}` : "/collection"
                        }
                        className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-purple-500"
                      >
                        <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-slate-800">
                          {item.game?.cover_url ? (
                            <img
                              src={item.game.cover_url}
                              alt={`Jaquette de ${item.game.title}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                              JRPG
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium text-white">
                            {item.game?.title ?? "Jeu inconnu"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {item.platform?.name ?? "Plateforme inconnue"} ·{" "}
                            {getStatusLabel(item.status)}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/games"
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm font-medium text-slate-200 hover:border-purple-500"
                >
                  + Ajouter un JRPG
                </Link>

                <Link
                  href="/account"
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm font-medium text-slate-200 hover:border-purple-500"
                >
                  Voir mon compte
                </Link>
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
