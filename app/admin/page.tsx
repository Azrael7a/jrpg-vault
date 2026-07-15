import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Administration
          </p>

          <h1 className="mt-2 text-4xl font-bold text-white">
            Tableau de bord
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Gère le contenu de JRPG Vault : catalogue, actualités et sorties.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-8 py-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/games"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Catalogue
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Gérer les jeux
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Modifier les fiches jeux, les jaquettes, descriptions, éditeurs,
              développeurs et années.
            </p>

            <p className="mt-5 text-sm text-purple-300">Ouvrir →</p>
          </Link>

          <Link
            href="/admin/games/new"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Nouveau jeu
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Ajouter un jeu
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Créer une nouvelle fiche jeu dans le catalogue, même sans sortie
              associée.
            </p>

            <p className="mt-5 text-sm text-purple-300">Créer →</p>
          </Link>

          <Link
            href="/admin/news"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Actualités
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Gérer les news
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Modifier, publier ou supprimer les actualités du site.
            </p>

            <p className="mt-5 text-sm text-purple-300">Ouvrir →</p>
          </Link>

          <Link
            href="/admin/news/new"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Nouvelle news
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Ajouter une actualité
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Créer une actualité et la lier à une fiche jeu du catalogue.
            </p>

            <p className="mt-5 text-sm text-purple-300">Créer →</p>
          </Link>

          <Link
            href="/admin/releases"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Sorties
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Gérer les sorties
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Modifier les dates, plateformes, régions et statuts des sorties.
            </p>

            <p className="mt-5 text-sm text-purple-300">Ouvrir →</p>
          </Link>

          <Link
            href="/admin/releases/new"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl hover:border-purple-500 hover:bg-slate-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Nouvelle sortie
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Ajouter une sortie
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Ajouter une sortie à venir et créer rapidement un jeu si besoin.
            </p>

            <p className="mt-5 text-sm text-purple-300">Créer →</p>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Liens rapides
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Accueil
            </Link>

            <Link
              href="/games"
              className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Catalogue public
            </Link>

            <Link
              href="/news"
              className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Actualités publiques
            </Link>

            <Link
              href="/releases"
              className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Sorties publiques
            </Link>

            <Link
              href="/collection"
              className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-purple-500"
            >
              Ma collection
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
