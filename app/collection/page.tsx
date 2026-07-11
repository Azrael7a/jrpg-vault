import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CollectionList from "./CollectionList";

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
  status:
    | "owned"
    | "playing"
    | "completed"
    | "backlog"
    | "wishlist"
    | "preordered"
    | "abandoned";
  format: "physical" | "digital" | "both";
  region: "PAL" | "US" | "JAP" | "ASIA" | "WORLD";
  personal_rating: number | null;
  notes: string | null;
  created_at: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

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

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Ma collection</h1>

      <p className="mt-2 text-gray-600">
        Jeux dans ta collection : {items.length}
      </p>

      <CollectionList items={items} />
    </main>
  );
}
