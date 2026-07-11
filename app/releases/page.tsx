import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  confirmed: "Confirmé",
  rumor: "Rumeur",
  delayed: "Repoussé",
  released: "Sorti",
};

export default async function ReleasesPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: releases, error } = await supabase
    .from("game_releases")
    .select(`
      id,
      release_date,
      region,
      physical,
      digital,
      status,
      edition_name,
      games (
        title,
        slug
      ),
      platforms (
        name
      )
    `)
    .gte("release_date", today)
    .order("release_date", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Prochaines sorties JRPG</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Prochaines sorties JRPG</h1>

      <p className="mt-2 text-gray-600">
        Calendrier des sorties JRPG à surveiller.
      </p>

      <div className="mt-6 grid gap-4">
        {releases?.length === 0 && (
          <div className="rounded-xl border p-4">
            Aucune sortie à venir pour le moment.
          </div>
        )}

        {releases?.map((release) => (
          <div key={release.id} className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">
              <Link href={`/games/${release.games?.slug}`}>
                {release.games?.title}
              </Link>
            </h2>

            <p>Date : {release.release_date}</p>
            <p>Plateforme : {release.platforms?.name}</p>
            <p>Région : {release.region}</p>
            <p>Édition : {release.edition_name ?? "Non précisée"}</p>
            <p>Physique : {release.physical ? "Oui" : "Non / inconnu"}</p>
            <p>Numérique : {release.digital ? "Oui" : "Non / inconnu"}</p>
            <p>Statut : {statusLabels[release.status] ?? release.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
