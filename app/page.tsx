import { createClient } from "@/utils/supabase/server";
import HomeLatestNews from "@/components/home/HomeLatestNews";
import HomeReleasesSection from "@/components/home/HomeReleasesSection";
import HomeVaultSummary from "@/components/home/HomeVaultSummary";

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

type FollowedGameRow = {
  game_id: number | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
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
  let followedGameIds: number[] = [];

  if (user) {
    const { data: collectionData } = await supabase
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

    const rawCollectionItems =
      (collectionData ?? []) as unknown as RawCollectionItem[];

    collectionItems = rawCollectionItems.map((item) => ({
      id: item.id,
      game_id: item.game_id,
      status: item.status,
      created_at: item.created_at,
      game: normalizeRelation(item.games),
      platform: normalizeRelation(item.platforms),
    }));

    const { data: followedData } = await supabase
      .from("user_followed_games")
      .select("game_id")
      .eq("user_id", user.id);

    const followedRows = (followedData ?? []) as unknown as FollowedGameRow[];

    followedGameIds = followedRows
      .map((row) => row.game_id)
      .filter((gameId): gameId is number => gameId !== null);
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
  const latestItem = collectionItems[0] ?? null;

  const rawNews = (newsData ?? []) as unknown as RawNewsItem[];

  const news: NewsItem[] = rawNews.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    published_at: item.published_at,
    related_game: normalizeRelation(item.related_game),
  }));

  const rawReleases = (releasesData ?? []) as unknown as RawRelease[];

  const releases = rawReleases.map((release) => ({
    id: release.id,
    game_id: release.game_id,
    release_date: release.release_date,
    edition_name: release.edition_name,
    region: release.region,
    game: normalizeRelation(release.games),
    platform: normalizeRelation(release.platforms),
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-8 py-12">
        <HomeLatestNews news={news} />

        <HomeVaultSummary
          isLoggedIn={Boolean(user)}
          total={total}
          stats={stats}
          latestItem={latestItem}
        />
      </div>

      <HomeReleasesSection
        releases={releases}
        followedGameIds={followedGameIds}
        isLoggedIn={Boolean(user)}
      />
    </main>
  );
}
