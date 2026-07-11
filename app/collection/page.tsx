import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import DeleteCollectionItemButton from "./DeleteCollectionItemButton";
import UpdateCollectionStatusSelect from "./UpdateCollectionStatusSelect";

const statusLabels: Record<string, string> = {
  owned: "Possédé",
  playing: "En cours",
  completed: "Terminé",
  backlog: "Backlog",
  wishlist: "Wishlist",
  preordered: "Précommandé",
  abandoned: "Abandonné",
};

const formatLabels: Record<string, string> = {
  physical: "Physique",
  digital: "Numérique",
  both: "Les deux",
};

type RawCollectionItem = {
  id: number;
  status: string;
  format: string;
  region: string;
  personal_rating: number | null;
  games:
    | {
        title: string;
        slug: string;
      }
    | {
        title: string;
        slug: string;
      }[]
    | null;
  platforms:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

export default async function CollectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Ma collection</h1>
        <p className="mt-4">Tu dois être connecté pour voir ta collection.</p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("user_collections")
    .select(`
      id,
      status,
      format,
      region,
      personal_rating,
      games (
        title,
        slug
      ),
      platforms (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Ma collection</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const collection = (data ?? []) as unknown as RawCollectionItem[];

  const collectionItems = collection.map((item) => {
    const game = Array.isArray(item.games) ? item.games[0] : item.games;
    const platform = Array.isArray(item.platforms)
      ? item.platforms[0]
      : item.platforms;

    return {
      ...item,
      game,
      platform,
    };
  });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Ma collection</h1>

      <p className="mt-2 text-gray-600">
        Jeux dans ta collection : {collectionItems.length}
      </p>

      <div className="mt-6 grid gap-4">
        {collectionItems.map((item) => (
          <div key={item.id} className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">
              {item.game?.slug ? (
                <Link href={`/games/${item.game.slug}`}>
                  {item.game.title}
                </Link>
              ) : (
                "Jeu inconnu"
              )}
            </h2>

            <p>Plateforme : {item.platform?.name ?? "Non précisée"}</p>
            <p>Format : {formatLabels[item.format] ?? item.format}</p>
            <p>Région : {item.region}</p>

            <UpdateCollectionStatusSelect
              itemId={item.id}
              currentStatus={item.status}
            />

            <DeleteCollectionItemButton itemId={item.id} />
          </div>
        ))}
      </div>
    </main>
  );
}
