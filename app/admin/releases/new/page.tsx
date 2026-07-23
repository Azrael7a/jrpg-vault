import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createReleaseGroup } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Game = {
  id: number;
  title: string;
  slug: string;
};

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
};

export default async function NewReleasePage() {
  const { supabase } = await requireAdmin();

  const [{ data: gamesData }, { data: platformsData }] = await Promise.all([
    supabase
      .from("games")
      .select("id, title, slug")
      .order("title", { ascending: true }),

    supabase
      .from("platforms")
      .select("id, name, manufacturer")
      .order("name", { ascending: true }),
  ]);

  const games = (gamesData ?? []) as Game[];
  const platforms = (platformsData ?? []) as Platform[];

  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/releases" className="text-sm text-purple-300 underline">
          ← Retour au calendrier admin
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Ajouter une sortie
          </h1>

          <p className="mt-2 text-slate-400">
            Choisis un jeu existant ou crée rapidement un nouveau jeu, puis coche
            toutes les plateformes concernées.
          </p>
        </div>

        <form action={createReleaseGroup} className="mt-8 grid gap-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-bold text-white">Jeu existant</h2>

            <p className="mt-1 text-sm text-slate-400">
              Utilise ce champ si le jeu existe déjà dans le catalogue.
            </p>

            <select
              name="existing_game_id"
              defaultValue=""
              className="mt-4 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            >
              <option value="">-- Aucun, créer un nouveau jeu --</option>

              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-xl font-bold text-white">
              Créer un jeu rapidement
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Remplis cette partie seulement si le jeu n’existe pas encore.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Titre</span>
                <input
                  name="new_title"
                  type="text"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Ex : Trails in the Sky 2nd Chapter"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">
                  Slug personnalisé
                </span>
                <input
                  name="new_slug"
                  type="text"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Optionnel"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-slate-300">URL de jaquette</span>
                <input
                  name="new_cover_url"
                  type="url"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Année</span>
                <input
                  name="new_release_year"
                  type="number"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="2026"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Développeur</span>
                <input
                  name="new_developer"
                  type="text"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Optionnel"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm text-slate-300">Éditeur</span>
                <input
                  name="new_publisher"
                  type="text"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  placeholder="Optionnel"
                />
              </label>
            </div>
          </section>

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
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Région</span>
                <select
                  name="region"
                  defaultValue="PAL"
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
                  defaultValue="confirmed"
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
                    defaultChecked
                    className="h-4 w-4"
                  />
                  Physique
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
                  <input
                    name="digital"
                    type="checkbox"
                    defaultChecked
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
              Créer les sorties
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
