import { createClient } from "@/utils/supabase/server";
import AddToCollectionButton from "./AddToCollectionButton";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !game) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p>Jeu introuvable.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">{game.title}</h1>

      <p className="mt-4 text-gray-700">{game.description}</p>

      <div className="mt-4 text-sm text-gray-600">
        <p>Série : {game.series}</p>
        <p>Développeur : {game.developer}</p>
        <p>Éditeur : {game.publisher}</p>
        <p>Année : {game.release_year}</p>
      </div>

      <div className="mt-6">
        <AddToCollectionButton gameId={game.id} />
      </div>
    </main>
  );
}
