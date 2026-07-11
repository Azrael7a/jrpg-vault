import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: gamesCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true });

  const { count: collectionCount } = user
    ? await supabase
        .from("user_collections")
        .select("*", { count: "exact", head: true })
    : { count: 0 };

  const today = new Date().toISOString().slice(0, 10);

  const { data: releases } = await supabase
    .from("game_releases")
    .select(`
      id,
      release_date,
      games (
        title,
        slug
      ),
      platforms (
        name
      )
    `)
    .gte("release_date", today)
    .order("release_date", { ascending: true })
    .limit(3);

  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, summary, published_at")
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="rounded-2xl border p-8">
        <h1 className="text-4xl font-bold">JRPG Vault</h1>

        <p className="mt-4 text-lg text-gray-600">
          Gère ta collection JRPG, suis ton backlog et surveille les prochaines sorties.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/games" className="rounded bg-black px-4 py-2 text-white">
            Voir le catalogue
          </Link>

          <Link href="/collection" className="rounded border px-4 py-2">
            Ma collection
          </Link>

          <Link href="/releases" className="rounded border px-4 py-2">
            Prochaines sorties
          </Link>

          <Link href="/news" className="rounded border px-4 py-2">
            Actualités
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Jeux au catalogue</p>
          <p className="mt-2 text-3xl font-bold">{gamesCount ?? 0}</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Jeux dans ta collection</p>
          <p className="mt-2 text-3xl font-bold">{collectionCount ?? 0}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Prochaines sorties</h2>
            <Link href="/releases" className="text-sm underline">
              Tout voir
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {releases?.length === 0 && (
              <div className="rounded-xl border p-4 text-gray-600">
                Aucune sortie à venir.
              </div>
            )}

            {releases?.map((release) => (
              <Link
                key={release.id}
                href={`/games/${release.games?.slug}`}
                className="rounded-xl border p-4 hover:bg-gray-50"
              >
                <h3 className="font-semibold">{release.games?.title}</h3>
                <p className="text-sm text-gray-600">
                  {release.release_date} — {release.platforms?.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Actualités</h2>
            <Link href="/news" className="text-sm underline">
              Tout voir
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {news?.length === 0 && (
              <div className="rounded-xl border p-4 text-gray-600">
                Aucune actualité pour le moment.
              </div>
            )}

            {news?.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="rounded-xl border p-4 hover:bg-gray-50"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
