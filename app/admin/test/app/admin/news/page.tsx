import Link from "next/link";

import { requireAdmin } from "@/lib/auth/require-admin";

type NewsItem = {
  id: number;
  title: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Non publiée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function AdminNewsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("news")
    .select("id, title, status, published_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Impossible de charger les actualités : ${error.message}`,
    );
  }

  const newsList = (data ?? []) as NewsItem[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Gestion des actualités
          </h1>

          <p className="mt-2 text-zinc-400">
            Ajoute, modifie et publie les actualités du site.
          </p>
        </div>

        <Link
          href="/admin/news/new"
          className="rounded-lg bg-violet-600 px-5 py-3 text-center font-semibold text-white hover:bg-violet-500"
        >
          Ajouter une actualité
        </Link>
      </div>

      {newsList.length === 0 ? (
        <section className="mt-10 rounded-xl border border-dashed border-white/15 p-10 text-center">
          <h2 className="text-xl font-semibold">
            Aucune actualité
          </h2>

          <p className="mt-2 text-zinc-400">
            La table fonctionne, mais aucune actualité n’a encore été créée.
          </p>

          <Link
            href="/admin/news/new"
            className="mt-6 inline-flex rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white"
          >
            Créer la première actualité
          </Link>
        </section>
      ) : (
        <section className="mt-10 overflow-hidden rounded-xl border border-white/10">
          <div className="divide-y divide-white/10">
            {newsList.map((news) => (
              <article
                key={news.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold">
                      {news.title}
                    </h2>

                    <span
                      className={
                        news.status === "published"
                          ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300"
                          : "rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300"
                      }
                    >
                      {news.status === "published"
                        ? "Publié"
                        : "Brouillon"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {formatDate(news.published_at)}
                  </p>
                </div>

                <Link
                  href={`/admin/news/${news.id}/edit`}
                  className="rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium hover:bg-white/5"
                >
                  Modifier
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
