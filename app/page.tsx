import HomeLatestNews from "@/components/home/HomeLatestNews";
import HomeReleasesSection from "@/components/home/HomeReleasesSection";
import HomeVaultSummary from "@/components/home/HomeVaultSummary";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type HomeNewsItem = {
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
  cover_url: string | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type RawRelease = {
  id: number;
  game_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type RawCollectionItem = {
  id: number;
  status: CollectionStatus;
  created_at: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type FollowedGameRow = {
  game_id: number | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const { data: newsData, error: newsError } = await supabase
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
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("published_at", {
      ascending: false,
    })
    .limit(5);

  if (newsError) {
    console.error("Erreur pendant le chargement des actualités :", newsError);
  }

  const latestNews = (newsData ?? []) as HomeNewsItem[];

  const { data: releasesData, error: releasesError } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      game_id,
      region,
      release_date,
      physical,
      digital,
      status,
      edition_name,
      games (
        id,
        title,
        slug,
        cover_url
      ),
      platforms (
        id,
        name,
        manufacturer
      )
    `,
    )
    .not("release_date", "is", null)
    .gte("release_date", today)
    .order("release_date", {
      ascending: true,
    })
    .limit(24);

  if (releasesError) {
    console.error("Erreur pendant le chargement des sorties :", releasesError);
  }

  const releases = ((releasesData ?? []) as unknown as RawRelease[])
    .map((release) => ({
      id: release.id,
      game_id: release.game_id,
      region: release.region,
      release_date: release.release_date,
      physical: release.physical,
      digital: release.digital,
      status: release.status,
      edition_name: release.edition_name,
      game: normalizeRelation(release.games),
      platform: normalizeRelation(release.platforms),
    }))
    .filter(
      (
        release,
      ): release is typeof release & {
        release_date: string;
        game: GameRelation;
        platform: PlatformRelation;
      } =>
        Boolean(release.release_date && release.game && release.platform),
    );

  const stats: Record<CollectionStatus, number> = {
    owned: 0,
    playing: 0,
    completed: 0,
    backlog: 0,
    wishlist: 0,
    preordered: 0,
    abandoned: 0,
  };

  let total = 0;

  let latestItem: {
    id: number;
    status: CollectionStatus;
    created_at: string | null;
    game: GameRelation | null;
    platform: PlatformRelation | null;
  } | null = null;

  let followedGameIds: number[] = [];

  if (user) {
    const [collectionResult, followedGamesResult] = await Promise.all([
      supabase
        .from("user_collections")
        .select(
          `
          id,
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
            name,
            manufacturer
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("user_followed_games")
        .select("game_id")
        .eq("user_id", user.id),
    ]);

    if (collectionResult.error) {
      console.error(
        "Erreur pendant le chargement de la collection :",
        collectionResult.error,
      );
    }

    if (followedGamesResult.error) {
      console.error(
        "Erreur pendant le chargement des jeux suivis :",
        followedGamesResult.error,
      );
    }

    const collectionItems = (
      (collectionResult.data ?? []) as unknown as RawCollectionItem[]
    ).map((item) => ({
      id: item.id,
      status: item.status,
      created_at: item.created_at,
      game: normalizeRelation(item.games),
      platform: normalizeRelation(item.platforms),
    }));

    total = collectionItems.length;

    for (const item of collectionItems) {
      if (item.status in stats) {
        stats[item.status] += 1;
      }
    }

    latestItem = collectionItems[0] ?? null;

    followedGameIds = (
      (followedGamesResult.data ?? []) as unknown as FollowedGameRow[]
    )
      .map((item) => item.game_id)
      .filter((gameId): gameId is number => typeof gameId === "number");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full">
          <HomeLatestNews news={latestNews} />
        </section>

        <section className="mt-8 w-full">
          <HomeVaultSummary
            isLoggedIn={Boolean(user)}
            stats={stats}
            total={total}
            latestItem={latestItem}
          />
        </section>

        <section className="mt-8 w-full">
          <HomeReleasesSection
            releases={releases}
            followedGameIds={followedGameIds}
            isLoggedIn={Boolean(user)}
          />
        </section>
      </div>
    </main>
  );
}
