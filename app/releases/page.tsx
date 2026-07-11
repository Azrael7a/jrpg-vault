import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  confirmed: "Confirmé",
  rumor: "Rumeur",
  delayed: "Repoussé",
  released: "Sorti",
};

type GameRelation =
  | {
      title: string;
      slug: string;
    }
  | {
      title: string;
      slug: string;
    }[]
  | null;

type PlatformRelation =
  | {
      name: string;
    }
  | {
      name: string;
    }[]
  | null;

type RawRelease = {
  id: number;
  release_date: string | null;
  region: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  games: GameRelation;
  platforms: PlatformRelation;
};

export default async function ReleasesPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
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

  const releases = (data ?? []) as unknown as RawRelease[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Prochaines sorties JRPG</h1>

      <p className="mt-2 text-gray-600">
        Calendrier des sorties JRPG à surveiller.
      </p>

      <div className="mt-6 grid gap-4">
        {releases.length === 0 && (
          <div className="rounded-xl border p-4">
            Aucune sortie à venir pour le moment.
          </div>
        )}

        {releases.map((release) => {
          const game = Array.isArray(release.games)
            ? release.games[0]
            : release.games;

          const platform = Array.isArray(release.platforms)
            ? release.platforms[0]
            : release.platforms;

          return (
            <div key={release.id} className="rounded-xl border p-4">
              <h2 className="text-xl font-semibold">
                {game?.slug ? (
                  <Link href={`/games/${game.slug}`}>
                    {game.title}
                  </Link>
                ) : (
                  "Jeu inconnu"
                )}
              </h2>

              <p>Date : {release.release_date ?? "Non précisée"}</p>
              <p>Plateforme : {platform?.name ?? "Non précisée"}</p>
              <p>Région : {release.region ?? "Non précisée"}</p>
              <p>Édition : {release.edition_name ?? "Non précisée"}</p>
              <p>Physique : {release.physical ? "Oui" : "Non / inconnu"}</p>
              <p>Numérique : {release.digital ? "Oui" : "Non / inconnu"}</p>
              <p>
                Statut :{" "}
                {release.status
                  ? statusLabels[release.status] ?? release.status
                  : "Non précisé"}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
