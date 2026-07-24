import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteReleaseGroup,
  markReleaseGroupAsReleased,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type PlatformRelation = {
  id: number;
  name: string;
};

type RawRelease = {
  id: number;
  game_id: number;
  release_date: string | null;
  region: string | null;
  edition_name: string | null;
  status: string | null;
  physical: boolean | null;
  digital: boolean | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type GroupedRelease = {
  game_id: number;
  game: GameRelation;
  release_date: string | null;
  region: string | null;
  status: string | null;
  physical: boolean | null;
  digital: boolean | null;
  editionNames: string[];
  platforms: PlatformRelation[];
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
    case "confirmed":
      return "Confirmé";
    case "rumor":
      return "Rumeur";
    case "delayed":
      return "Repoussé";
    case "released":
      return "Sorti";
    default:
      return "Statut inconnu";
  }
}

function groupReleases(releases: RawRelease[]) {
  const grouped = new Map<number, GroupedRelease>();

  for (const release of releases) {
    const game = normalizeRelation(release.games);
    const platform = normalizeRelation(release.platforms);

    if (!game || !platform) {
      continue;
    }

    const existing = grouped.get(release.game_id);

    if (!existing) {
      grouped.set(release.game_id, {
        game_id: release.game_id,
        game,
        release_date: release.release_date,
        region: release.region,
        status: release.status,
        physical: release.physical,
        digital: release.digital,
        editionNames: release.edition_name ? [release.edition_name] : [],
        platforms: [platform],
      });
      continue;
    }

    if (!existing.platforms.some((item) => item.id === platform.id)) {
      existing.platforms.push(platform);
    }

    if (
      release.edition_name &&
      !existing.editionNames.includes(release.edition_name)
    ) {
      existing.editionNames.push(release.edition_name);
    }

    if (
      release.release_date &&
      (!existing.release_date || release.release_date < existing.release_date)
    ) {
      existing.release_date = release.release_date;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const dateA = a.release_date ?? "9999-12-31";
    const dateB = b.release_date ?? "9999-12-31";

    return dateA.localeCompare(dateB);
  });
}

export default async function AdminReleasesPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      game_id,
      release_date,
      region,
      edition_name,
      status,
      physical,
      digital,
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
    `,
    )
    .order("release_date", { ascending: true });

  const releases = groupReleases((data ?? []) as unknown as RawRelease[]);

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Calendrier des sorties
            </h1>

            <p className="mt-2 text-slate-400">
              Modifie les dates, marque les jeux sortis ou supprime les erreurs.
            </p>
          </div>

          <Link
            href="/admin/releases/new"
            className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
          >
            + Ajouter une sortie
          </Link>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">
            Erreur : {error.message}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          {releases.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Aucune sortie n’est encore référencée.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {releases.map((release) => (
                <div
                  key={release.game_id}
                  className="grid gap-4 p-5 md:grid-cols-[80px_1fr_auto]"
                >
                  <div className="h-24 w-16 overflow-hidden rounded bg-slate-800">
                    {release.game.cover_url ? (
                      <img
                        src={release.game.cover_url}
                        alt={`Jaquette de ${release.game.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                        JRPG
                      </div>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/games/${release.game.slug}`}
                      className="text-lg font-semibold text-white hover:text-purple-300"
                    >
                      {release.game.title}
                    </Link>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {release.platforms.map((platform) => (
                        <span
                          key={platform.id}
                          className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                        >
                          {platform.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span>{formatDate(release.release_date)}</span>
                      <span>{release.region ?? "Région inconnue"}</span>
                      <span>{formatStatus(release.status)}</span>
                      <span>
                        {release.physical && release.digital
                          ? "Physique + numérique"
                          : release.physical
                            ? "Physique"
                            : release.digital
                              ? "Numérique"
                              : "Format inconnu"}
                      </span>
                    </div>

                    {release.editionNames.length > 0 && (
                      <p className="mt-2 text-sm text-slate-500">
                        {release.editionNames.join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-start gap-2 md:justify-end">
                    <Link
                      href={`/admin/releases/${release.game_id}/edit`}
                      className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-purple-500 hover:text-white"
                    >
                      Modifier
                    </Link>

                    {release.status !== "released" && (
                      <form action={markReleaseGroupAsReleased}>
                        <input
                          type="hidden"
                          name="game_id"
                          value={release.game_id}
                        />

                        <button
                          type="submit"
                          className="rounded border border-green-700 px-3 py-2 text-sm text-green-300 hover:border-green-500 hover:text-green-200"
                        >
                          Marquer sorti
                        </button>
                      </form>
                    )}

                    <form action={deleteReleaseGroup}>
                      <input
                        type="hidden"
                        name="game_id"
                        value={release.game_id}
                      />

                      <button
                        type="submit"
                        className="rounded border border-red-900 px-3 py-2 text-sm text-red-300 hover:border-red-500 hover:text-red-200"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
