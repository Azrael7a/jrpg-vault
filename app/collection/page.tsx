import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CollectionList from "./CollectionList";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type RawCollectionItem = {
  id: number;
  status: CollectionStatus;
  format: "physical" | "digital" | "both";
  region: "PAL" | "US" | "JAP" | "ASIA" | "WORLD";
  personal_rating: number | null;
  notes: string | null;
  created_at: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

function getStatLabel(status: CollectionStatus) {
  switch (status) {
    case "owned":
      return "Possédés";
    case "playing":
      return "En cours";
    case "completed":
      return "Terminés";
    case "backlog":
      return "Backlog";
    case "wishlist":
      return "Wishlist";
    case "preordered":
      return "Précommandés";
    case "abandoned":
      return "Abandonnés";
  }
}

export default async function CollectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("user_collections")
    .select(
      `
      id,
      status,
      format,
      region,
      personal_rating,
      notes,
      created_at,
      games (
        id,
        title,
        slug,
        series,
        release_year,
        cover_url
      ),
      platforms (
        id,
        name,
        manufacturer
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Ma collection</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const rawItems = (data ?? []) as RawCollectionItem[];

  const items = rawItems.map((item) => {
    const game = Array.isArray(item.games)
      ? item.games[0] ?? null
      : item.games;

    const platform = Array.isArray(item.platforms)
      ? item.platforms[0] ?? null
      : item.platforms;

    return {
      id: item.id,
      status: item.status,
      format: item.format,
      region: item.region,
      personal_rating: item.personal_rating,
      notes: item.notes,
      created_at: item.created_at,
      game,
      platform,
    };
  });

  const stats: Record<CollectionStatus, number> = {
    owned: 0,
    playing: 0,
    completed: 0,
    backlog: 0,
    wishlist: 0,
    preordered: 0,
    abandoned: 0,
  };

  for (const item of items) {
    stats[item.status] += 1;
  }

  const total = items.length;
  const completionRate =
    total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  const statCards: { label: string; value: number | string }[] = [
    {
      label: "Total",
      value: total,
    },
    {
      label: "Terminés",
      value: stats.completed,
    },
    {
      label: "En cours",
      value: stats.playing,
    },
    {
      label: "Backlog",
      value: stats.backlog,
    },
    {
      label: "Wishlist",
      value: stats.wishlist,
    },
    {
      label: "Progression",
      value: `${completionRate}%`,
    },
  ];

  const secondaryStats: CollectionStatus[] = [
    "owned",
    "preordered",
    "abandoned",
  ];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">Ma collection</h1>

          <p className="mt-2 text-gray-600">
            Suis tes JRPG possédés, en cours, terminés, en backlog ou en
            wishlist.
          </p>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-gray-50 p-4">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
        {secondaryStats.map((status) => (
          <span key={status} className="rounded-full border px-3 py-1">
            {getStatLabel(status)} : {stats[status]}
          </span>
        ))}
      </section>

      <CollectionList items={items} />
    </main>
  );
}
