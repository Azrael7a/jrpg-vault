import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AddToCollectionButton from "./AddToCollectionButton";

type TagRelation = {
  tags:
    | {
        id: number;
        name: string;
      }
    | {
        id: number;
        name: string;
      }[]
    | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type VersionRelation = {
  id: number;
  region: string;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  edition_name: string | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type ReleaseRelation = VersionRelation & {
  status: string | null;
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
  game_platforms: VersionRelation[] | null;
  game_releases: ReleaseRelation[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizeArray<T>(relation: T | T[] | null): T[] {
  if (!relation) {
    return [];
  }

  return Array.isArray(relation) ? relation : [relation];
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR");
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

function formatMedia(physical: boolean | null, digital: boolean | null) {
  if (physical && digital) {
    return "Physique + numérique";
  }

  if (physical) {
    return "Physique";
  }

  if (digital) {
    return "Numérique";
  }

  return "Format inconnu";
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
      game_platforms (
        id,
        region,
        release_date,
        physical,
        digital,
        edition_name,
        platforms (
          id,
          name,
          manufacturer
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
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const game = data as Game;

  const tags =
    game.game_tags
      ?.flatMap((relation) => normalizeArray(relation.tags))
      .filter((tag): tag is { id: number; name: string } => Boolean(tag)) ??
    [];

  const versions =
    game.game_platforms
      ?.map((version) => ({
        ...version,
        platform: normalizeRelation(version.platforms),
      }))
      .sort((a, b) => {
        const platformComparison = (a.platform?.name ?? "").localeCompare(
          b.platform?.name ?? "",
          "fr",
        );

        if (platformComparison !== 0) {
          return platformComparison;
        }

        return a.region.localeCompare(b.region, "fr");
      }) ?? [];

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
      <Link href="/games" className="text-sm text-violet-300 underline">
        ← Retour au catalogue
      </Link>

      <section className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={`Jaquette de ${game.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center px-4 text-center text-sm text-slate-500">
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
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {game.series}
            </p>
          )}

          <h1 className="mt-2 text-4xl font-bold">{game.title}</h1>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {game.release_year && (
              <span className="jrpg-badge">{game.release_year}</span>
            )}

            {game.developer && (
              <span className="jrpg-badge">
                Développeur : {game.developer}
              </span>
            )}

            {game.publisher && (
              <span className="jrpg-badge">
                Éditeur : {game.publisher}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Description</h2>

            {game.description ? (
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-300">
                {game.description}
              </p>
            ) : (
              <p className="mt-3 text-slate-500">
                Aucune description n’est encore renseignée pour ce jeu.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Versions disponibles</h2>
        <p className="mt-2 text-slate-400">
          Supports et régions proposés lors de l’ajout à une collection.
        </p>

        {versions.length === 0 ? (
          <div className="jrpg-card mt-4 p-6 text-slate-400">
            Aucune version n’est encore renseignée pour ce jeu.
          </div>
        ) : (
          <div className="jrpg-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-900/60">
                <tr>
                  <th className="p-3">Plateforme</th>
                  <th className="p-3">Région</th>
                  <th className="p-3">Date d’origine</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Édition</th>
                </tr>
              </thead>

              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-b border-slate-800">
                    <td className="p-3">
                      {version.platform?.name ?? "Plateforme inconnue"}
                    </td>
                    <td className="p-3">{version.region}</td>
                    <td className="p-3">
                      {formatDate(version.release_date)}
                    </td>
                    <td className="p-3">
                      {formatMedia(version.physical, version.digital)}
                    </td>
                    <td className="p-3">
                      {version.edition_name ?? "Standard"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {releases.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Calendrier des sorties</h2>
          <p className="mt-2 text-slate-400">
            Annonces et dates suivies dans la rubrique Sorties.
          </p>

          <div className="jrpg-card mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-900/60">
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
                  <tr key={release.id} className="border-b border-slate-800">
                    <td className="p-3">
                      {release.platform?.name ?? "Plateforme inconnue"}
                    </td>
                    <td className="p-3">{release.region}</td>
                    <td className="p-3">
                      {formatDate(release.release_date)}
                    </td>
                    <td className="p-3">
                      {formatMedia(release.physical, release.digital)}
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
        </section>
      )}
    </main>
  );
}
