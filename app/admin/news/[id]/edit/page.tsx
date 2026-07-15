import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateNews } from "../../actions";

type GameOption = {
  id: number;
  title: string;
};

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  source_url: string | null;
  category: string | null;
  status: string | null;
  published_at: string | null;
  related_game_id: number | null;
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

function formatDateForInput(date: string | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 16);
}

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const newsId = Number(id);

  if (!Number.isFinite(newsId)) {
    notFound();
  }

  const supabase = await requireAdmin();

  const [{ data: newsData, error: newsError }, { data: gamesData }] =
    await Promise.all([
      supabase
        .from("news")
        .select(
          `
          id,
          title,
          slug,
          summary,
          excerpt,
          content,
          image_url,
          source_url,
          category,
          status,
          published_at,
          related_game_id
        `,
        )
        .eq("id", newsId)
        .single(),

      supabase
        .from("games")
        .select("id, title")
        .order("title", { ascending: true }),
    ]);

  if (newsError || !newsData) {
    notFound();
  }

  const news = newsData as NewsItem;
  const games = (gamesData ?? []) as GameOption[];

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
              Modifier une actualité
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Modifie le contenu, le statut et le jeu lié à cette news.
            </p>
          </div>

          <form action={updateNews} className="mt-8 grid gap-6">
            <input type="hidden" name="id" value={news.id} />

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Titre
                </span>

                <input
                  name="title"
                  required
                  defaultValue={news.title}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Slug
                </span>

                <input
                  name="slug"
                  required
                  defaultValue={news.slug}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Jeu lié
              </span>

              <select
                name="related_game_id"
                defaultValue={news.related_game_id ?? ""}
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
                  defaultValue={news.category ?? ""}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Statut
                </span>

                <select
                  name="status"
                  defaultValue={news.status ?? "draft"}
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
                defaultValue={news.summary ?? ""}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Extrait
              </span>

              <textarea
                name="excerpt"
                rows={3}
                defaultValue={news.excerpt ?? ""}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Contenu
              </span>

              <textarea
                name="content"
                rows={12}
                defaultValue={news.content ?? ""}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Image URL
                </span>

                <input
                  name="image_url"
                  defaultValue={news.image_url ?? ""}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-300">
                  Source URL
                </span>

                <input
                  name="source_url"
                  defaultValue={news.source_url ?? ""}
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
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
                defaultValue={formatDateForInput(news.published_at)}
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
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
