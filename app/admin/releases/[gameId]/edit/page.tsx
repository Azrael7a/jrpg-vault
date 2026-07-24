import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateReleaseRows } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type Game = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type Release = {
  id: number;
  platform_id: number | null;
  release_date: string | null;
  region: string | null;
  status: string | null;
  edition_name: string | null;
  physical: boolean | null;
  digital: boolean | null;
};

async function ensureAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return supabase;
}

export default async function EditReleasePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const numericGameId = Number(gameId);

  if (!Number.isFinite(numericGameId)) {
    notFound();
  }

  const supabase = await ensureAdmin();

  const [{ data: gameData }, { data: platformsData }, { data: releasesData }] =
    await Promise.all([
      supabase
        .from("games")
        .select("id, title, slug, cover_url")
        .eq("id", numericGameId)
        .maybeSingle(),

      supabase
        .from("platforms")
        .select("id, name, manufacturer")
        .order("name", { ascending: true }),

      supabase
        .from("game_releases")
        .select(
          `
          id,
          platform_id,
          release_date,
          region,
          status,
          edition_name,
          physical,
          digital
        `,
        )
        .eq("game_id", numericGameId)
        .order("release_date", { ascending: true }),
    ]);

  if (!gameData) {
    notFound();
  }

  const game = gameData as Game;
  const platforms = (platformsData ?? []) as Platform[];
  const releases = (releasesData ?? []) as Release[];

  const firstRelease = releases[0] ?? null;

  function getReleaseForPlatform(platformId: number) {
    return releases.find((release) => release.platform_id === platformId) ?? null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/admin/releases" className="text-sm text-purple-300 underline">
          ← Retour au calendrier admin
        </Link>

        <div className="mt-8 grid gap-6 md:grid-cols-[120px_1fr]">
          <div className="h-40 w-28 overflow-hidden rounded bg-slate-800">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={`Jaquette de ${game.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                JRPG
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Modifier les sorties par support
            </h1>

            <p className="mt-2 text-xl text-slate-200">{game.title}</p>

            <p className="mt-2 max-w-3xl text-slate-400">
              Chaque plateforme peut avoir sa propre date, son propre statut et
              son propre format. Décoche une plateforme puis enregistre pour
              supprimer cette ligne de sortie.
            </p>
          </div>
        </div>

        <form action={updateReleaseRows} className="mt-8 grid gap-8">
          <input type="hidden" name="game_id" value={game.id} />

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Sorties par plateforme
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Coche les supports actifs et renseigne les dates séparément.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {platforms.map((platform) => {
                const release = getReleaseForPlatform(platform.id);
                const isEnabled = Boolean(release);

                const defaultReleaseDate =
                  release?.release_date ?? firstRelease?.release_date ?? "";

                const defaultRegion = release?.region ?? firstRelease?.region ?? "PAL";
                const defaultStatus =
                  release?.status ?? firstRelease?.status ?? "confirmed";
                const defaultEditionName =
                  release?.edition_name ?? firstRelease?.edition_name ?? "";

                const defaultPhysical =
                  release?.physical ?? firstRelease?.physical ?? true;
                const defaultDigital =
                  release?.digital ?? firstRelease?.digital ?? true;

                return (
                  <div
                    key={platform.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[180px_1fr] lg:items-start">
                      <label className="flex items-center gap-3 text-sm font-semibold text-white">
                        <input
                          name="enabled_platform_ids"
                          type="checkbox"
                          value={platform.id}
                          defaultChecked={isEnabled}
                          className="h-4 w-4"
                        />

                        <span>{platform.name}</span>
                      </label>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="grid gap-2">
                          <span className="text-xs text-slate-400">
                            Date de sortie
                          </span>

                          <input
                            name={`release_date_${platform.id}`}
                            type="date"
                            defaultValue={defaultReleaseDate}
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-slate-400">Région</span>

                          <select
                            name={`region_${platform.id}`}
                            defaultValue={defaultRegion}
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                          >
                            <option value="PAL">PAL</option>
                            <option value="US">US</option>
                            <option value="JAP">JAP</option>
                            <option value="ASIA">ASIA</option>
                            <option value="WORLD">WORLD</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-slate-400">Statut</span>

                          <select
                            name={`status_${platform.id}`}
                            defaultValue={defaultStatus}
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                          >
                            <option value="confirmed">Confirmé</option>
                            <option value="rumor">Rumeur</option>
                            <option value="delayed">Repoussé</option>
                            <option value="released">Sorti</option>
                          </select>
                        </label>

                        <label className="grid gap-2">
                          <span className="text-xs text-slate-400">Édition</span>

                          <input
                            name={`edition_name_${platform.id}`}
                            type="text"
                            defaultValue={defaultEditionName}
                            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                            placeholder="Standard"
                          />
                        </label>

                        <div className="grid gap-2">
                          <span className="text-xs text-slate-400">Format</span>

                          <div className="flex flex-wrap gap-3 rounded border border-slate-700 bg-slate-900 px-3 py-2">
                            <label className="flex items-center gap-2 text-sm text-slate-200">
                              <input
                                name={`physical_${platform.id}`}
                                type="checkbox"
                                defaultChecked={Boolean(defaultPhysical)}
                              />
                              Physique
                            </label>

                            <label className="flex items-center gap-2 text-sm text-slate-200">
                              <input
                                name={`digital_${platform.id}`}
                                type="checkbox"
                                defaultChecked={Boolean(defaultDigital)}
                              />
                              Numérique
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isEnabled && (
                      <p className="mt-3 text-xs text-slate-500">
                        Plateforme inactive actuellement. Coche-la pour créer une
                        sortie sur ce support.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/releases"
              className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Annuler
            </Link>

            <button
              type="submit"
              className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
