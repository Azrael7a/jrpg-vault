import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AddToCollectionButton from "./AddToCollectionButton";

type TagRelation = {
  tags: {
    id: number;
    name: string;
  } | null;
};

type ReleaseRelation = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  platforms:
    | {
        id: number;
        name: string;
        manufacturer: string | null;
      }
    | {
        id: number;
        name: string;
        manufacturer: string | null;
      }[]
    | null;
};

type Game = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  series: string | null;
  cover_url: string | null;
  release_year: number | null;
  game_tags: TagRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatStatus(status: string | null) {
  switch (status) {
    case "released":
      return "Sorti";
    case "confirmed":
      return "Confirmé";
    case "rumor":
      return "Rumeur";
    case "delayed":
      return "Repoussé";
    default:
      return "Statut inconnu";
  }
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      slug,
      description,
      developer,
      publisher,
      series,
      cover_url,
      release_year,
      game_tags (
        tags (
          id,
          name
        )
      ),
      game_releases (
        id,
        region,
        release_date,
        physical,
        digital,
        status,
        edition_name,
        platforms (
          id,
          name,
          manufacturer
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const game = data as Game;

  const tags =
    game.game_tags
      ?.map((relation) => relation.tags)
      .filter((tag): tag is { id: number; name: string } => Boolean(tag)) ?? [];

  const releases =
    game.game_releases
      ?.map((release) => ({
        ...release,
        platform: normalizeRelation(release.platforms),
      }))
      .sort((a, b) => {
        const dateA = a.release_date ?? "";
        const dateB = b.release_date ?? "";
        return dateA.localeCompare(dateB);
      }) ?? [];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link href="/games" className="text-sm underline">
        ← Retour au catalogue
      </Link>

      <section className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border bg-gray-100">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={`Jaquette de ${game.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center px-4 text-center text-sm text-gray-500">
                Pas de jaquette
              </div>
            )}
          </div>

          <div className="mt-4">
            <AddToCollectionButton gameId={game.id} />
          </div>
        </div>

        <div>
          {game.series && (
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {game.series}
            </p>
          )}

          <h1 className="mt-2 text-4xl font-bold">{game.title}</h1>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {game.release_year && (
              <span className="rounded bg-gray-100 px-2 py-1">
                {game.release_year}
              </span>
            )}

            {game.developer && (
              <span className="rounded bg-gray-100 px-2 py-1">
                Développeur : {game.developer}
              </span>
            )}

            {game.publisher && (
              <span className="rounded bg-gray-100 px-2 py-1">
                Éditeur : {game.publisher}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Description</h2>

            {game.description ? (
              <p className="mt-3 leading-7 text-gray-700">
                {game.description}
              </p>
            ) : (
              <p className="mt-3 text-gray-600">
                Aucune description n’est encore renseignée pour ce jeu.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Sorties référencées</h2>

        {releases.length === 0 ? (
          <div className="mt-4 rounded-xl border bg-gray-50 p-6 text-gray-600">
            Aucune sortie n’est encore renseignée pour ce jeu.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Plateforme</th>
                  <th className="p-3">Région</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Édition</th>
                </tr>
              </thead>

              <tbody>
                {releases.map((release) => (
                  <tr key={release.id} className="border-t">
                    <td className="p-3">
                      {release.platform?.name ?? "Plateforme inconnue"}
                    </td>

                    <td className="p-3">{release.region ?? "Inconnue"}</td>

                    <td className="p-3">{formatDate(release.release_date)}</td>

                    <td className="p-3">
                      {release.physical && release.digital
                        ? "Physique + démat"
                        : release.physical
                          ? "Physique"
                          : release.digital
                            ? "Dématérialisé"
                            : "Inconnu"}
                    </td>

                    <td className="p-3">{formatStatus(release.status)}</td>

                    <td className="p-3">
                      {release.edition_name ?? "Standard"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
