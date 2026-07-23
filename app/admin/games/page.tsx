import Link from "next/link";
import DeleteCatalogGameButton from "@/components/admin/DeleteCatalogGameButton";
import { requireAdmin } from "@/lib/auth/require-admin";

type PlatformRelation = {
  id: number;
  name: string;
  is_legacy: boolean;
};

type GamePlatformRelation = {
  id: number;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type RawGame = {
  id: number;
  title: string;
  slug: string;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  game_platforms: GamePlatformRelation[] | null;
};

function normalizeArray<T>(value: T | T[] | null): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("games")
    .select(
      `
        id,
        title,
        slug,
        release_year,
        cover_url,
        developer,
        game_platforms (
          id,
          platforms (
            id,
            name,
            is_legacy
          )
        )
      `,
    )
    .order("title");

  const games = ((data ?? []) as RawGame[]).map((game) => {
    const platformMap = new Map<number, PlatformRelation>();

    game.game_platforms?.forEach((gamePlatform) => {
      normalizeArray(gamePlatform.platforms).forEach((platform) => {
        platformMap.set(platform.id, platform);
      });
    });

    return {
      ...game,
      platforms: Array.from(platformMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "fr"),
      ),
    };
  });

  const successMessage = params.created
    ? "Jeu ajouté au catalogue."
    : params.updated
      ? "Jeu mis à jour."
      : params.deleted
        ? "Jeu supprimé."
        : null;

  const errorMessage =
    typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto w-full max-w-7xl p-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="jrpg-badge">Administration</p>
          <h1 className="mt-4 text-4xl font-bold">Catalogue des jeux</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Ajoute les anciens jeux et leurs versions sans les publier comme
            prochaines sorties.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/releases"
            className="jrpg-button-secondary px-4 py-3"
          >
            Gérer les sorties
          </Link>

          <Link
            href="/admin/games/new"
            className="jrpg-button-primary px-4 py-3"
          >
            + Ajouter un jeu
          </Link>
        </div>
      </div>

      {successMessage && (
        <p className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {errorMessage}
        </p>
      )}

      {error ? (
        <p className="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          Erreur : {error.message}
        </p>
      ) : games.length === 0 ? (
        <section className="jrpg-card mt-8 p-8 text-center">
          <h2 className="text-2xl font-bold">Catalogue vide</h2>
          <p className="mt-3 text-slate-400">
            Ajoute ton premier jeu depuis le bouton ci-dessus.
          </p>
        </section>
      ) : (
        <section className="jrpg-card mt-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Jeu</th>
                  <th className="px-4 py-3">Année</th>
                  <th className="px-4 py-3">Développeur</th>
                  <th className="px-4 py-3">Versions disponibles</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="border-b border-slate-800 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt=""
                            className="h-16 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-12 items-center justify-center rounded border border-slate-700 text-xs text-slate-500">
                            —
                          </div>
                        )}

                        <div>
                          <Link
                            href={`/games/${game.slug}`}
                            className="font-semibold text-slate-100 hover:text-violet-300"
                          >
                            {game.title}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">
                            {game.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {game.release_year ?? "—"}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {game.developer ?? "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {game.platforms.length > 0 ? (
                          game.platforms.map((platform) => (
                            <span
                              key={platform.id}
                              className={
                                platform.is_legacy
                                  ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200"
                                  : "rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200"
                              }
                            >
                              {platform.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">Aucun support</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/games/${game.id}/edit`}
                          className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
                        >
                          Modifier
                        </Link>

                        <DeleteCatalogGameButton
                          gameId={game.id}
                          title={game.title}
                        />
                      </div>
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
