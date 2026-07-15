import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createNews } from "../actions";

type GameOption = {
  id: number;
  title: string;
};

async function requireAdmin() {
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

export default async function NewNewsPage() {
  const supabase = await requireAdmin();

  const { data: gamesData, error: gamesError } = await supabase
    .from("games")
    .select("id, title")
    .order("title", { ascending: true });

  const games = (gamesData ?? []) as GameOption[];

  const defaultPublishedAt = new Date().toISOString().slice(0, 16);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <Link href="/admin/news" className="text-sm text-purple-300 underline">
          ← Retour aux actualités admin
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Ajouter une actualité
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Crée une news et lie-la éventuellement à une fiche jeu du catalogue.
            </p>
          </div>

          {gamesError && (
            <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
              Erreur pendant le chargement des jeux : {gamesError.message}
            </div>
          )}

          <form action={createNews} className="mt-8 grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Titre
                </span>

                <input
                  name="title"
                  required
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                  placeholder="Ex : Nouveau trailer pour..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Slug
                </span>

                <input
                  name="slug"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                  placeholder="laisse vide pour générer automatiquement"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Jeu lié
              </span>

              <select
                name="related_game_id"
                defaultValue=""
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
              >
                <option value="">Aucun jeu lié</option>

                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Catégorie
                </span>

                <input
                  name="category"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                  placeholder="News, Trailer, Test, Sortie..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Statut
                </span>

                <select
                  name="status"
                  defaultValue="draft"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Résumé court
              </span>

              <textarea
                name="summary"
                required
                rows={3}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                placeholder="Résumé affiché sur les cartes de news."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Extrait
              </span>

              <textarea
                name="excerpt"
                rows={3}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                placeholder="Optionnel. Si vide, le résumé sera utilisé."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Contenu
              </span>

              <textarea
                name="content"
                rows={12}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                placeholder="Contenu complet de l’actualité."
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Image URL
                </span>

                <input
                  name="image_url"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Source URL
                </span>

                <input
                  name="source_url"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                  placeholder="https://..."
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Date de publication
              </span>

              <input
                name="published_at"
                type="datetime-local"
                defaultValue={defaultPublishedAt}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
              />
            </label>

            <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/admin/news"
                className="text-sm text-slate-400 underline underline-offset-4 hover:text-white"
              >
                Annuler
              </Link>

              <button
                type="submit"
                className="rounded bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500"
              >
                Créer l’actualité
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
