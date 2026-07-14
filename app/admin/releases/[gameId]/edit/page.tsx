import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateReleaseGroup } from "../../actions";

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

  const selectedPlatformIds = releases
    .map((release) => release.platform_id)
    .filter((platformId): platformId is number => typeof platformId === "number");

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
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
              Modifier une sortie
            </h1>

            <p className="mt-2 text-xl text-slate-200">{game.title}</p>

            <p className="mt-2 text-slate-400">
              Corrige une date, ajoute ou retire une plateforme, ou passe la
              sortie en “Repoussé” ou “Sorti”.
            </p>
          </div>
        </div>

        <form action={updateReleaseGroup} className="mt-8 grid gap-8">
          <input type="hidden" name="game_id" value={game.id} />

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-bold text-white">
              Informations de sortie
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Date de sortie</span>
                <input
                  name="release_date"
                  type="date"
                  required
                  defaultValue={firstRelease?.release_date ?? ""}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Région</span>
                <select
                  name="region"
                  defaultValue={firstRelease?.region ?? "PAL"}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="PAL">PAL</option>
                  <option value="US">US</option>
                  <option value="JAP">JAP</option>
                  <option value="ASIA">ASIA</option>
                  <option value="WORLD">WORLD</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Statut</span>
                <select
                  name="status"
                  defaultValue={firstRelease?.status ?? "confirmed"}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="confirmed">Confirmé</option>
                  <option value="rumor">Rumeur</option>
                  <option value="delayed">Repoussé</option>
                  <option value="released">Sorti</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Édition</span>
                <input
                  name="edition_name"
                  type="text"
                  defaultValue={firstRelease?.edition_name ?? ""}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Standard, Deluxe, Collector..."
                />
              </label>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-300">
                Plateformes
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {platforms.map((platform) => (
                  <label
                    key={platform.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200"
                  >
                    <input
                      name="platform_ids"
                      type="checkbox"
                      value={platform.id}
                      defaultChecked={selectedPlatformIds.includes(platform.id)}
                      className="h-4 w-4"
                    />

                    <span>{platform.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-300">Format</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
                  <input
                    name="physical"
                    type="checkbox"
                    defaultChecked={Boolean(firstRelease?.physical)}
                    className="h-4 w-4"
                  />
                  Physique
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
                  <input
                    name="digital"
                    type="checkbox"
                    defaultChecked={Boolean(firstRelease?.digital)}
                    className="h-4 w-4"
                  />
                  Numérique
                </label>
              </div>
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
