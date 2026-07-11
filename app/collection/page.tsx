import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

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

  const { data: collection, error } = await supabase
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

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Ma collection</h1>

      <p className="mt-2 text-gray-600">
        Jeux dans ta collection : {collection?.length ?? 0}
      </p>

      <div className="mt-6 grid gap-4">
        {collection?.map((item) => (
          <div key={item.id} className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">
              <Link href={`/games/${item.games?.slug}`}>
                {item.games?.title}
              </Link>
            </h2>

            <p>Plateforme : {item.platforms?.name}</p>
            <p>Format : {item.format}</p>
            <p>Région : {item.region}</p>
            <p>Statut : {item.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
