import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type GameRelation = {
  title: string;
  slug: string;
} | null;

type PlatformRelation = {
  name: string;
} | null;

type RawRelease = {
  id: number;
  release_date: string | null;
  edition_name: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type Release = {
  id: number;
  release_date: string | null;
  edition_name: string | null;
  game: GameRelation;
  platform: PlatformRelation;
};

type NewsItem = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  published_at: string | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default async function HomePage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: gamesCount }, { count: releasesCount }, { count: newsCount }] =
    await Promise.all([
      supabase.from("games").select("*", { count: "exact", head: true }),
      supabase.from("game_releases").select("*", { count: "exact", head: true }),
      supabase.from("news").select("*", { count: "exact", head: true }),
    ]);

  const { data: releasesData } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      release_date,
      edition_name,
      games (
        title,
        slug
      ),
      platforms (
        name
      )
    `
    )
    .gte("release_date", today)
    .order("release_date", { ascending: true })
    .limit(3);

  const { data: newsData } = await supabase
    .from("news")
    .select("id, title, slug, summary, published_at")
    .order("published_at", { ascending: false })
    .limit(3);

  const releases: Release[] = ((releasesData ?? []) as RawRelease[]).map(
    (release) => ({
      id: release.id,
      release_date: release.release_date,
      edition_name: release.edition_name,
      game: normalizeRelation(release.games),
      platform: normalizeRelation(release.platforms),
    })
  );

  const news = (newsData ?? []) as NewsItem[];

  return (
    <main>
      <section className="border-b bg-gray-50">
        <div className="mx-auto grid max-w-5xl gap-8 px-8 py-16 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Collection JRPG · Backlog · Sorties
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              JRPG Vault
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-gray-600">
              Gère ta collection JRPG, suis ton backlog, tes jeux terminés, ta
              wishlist et les prochaines sorties importantes.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/games"
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Explorer le catalogue
              </Link>

              <Link
                href="/collection"
                className="rounded border px-4 py-2 text-sm font-medium hover:bg-white"
              >
                Voir ma collection
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">État du Vault</h2>

            <div className="mt-5 grid gap-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-3xl font-bold">{gamesCount ?? 0}</p>
                <p className="text-sm text-gray-600">jeux dans le catalogue</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-3xl font-bold">{releasesCount ?? 0}</p>
                <p className="text-sm text-gray-600">sorties référencées</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-3xl font-bold">{newsCount ?? 0}</p>
                <p className="text-sm text-gray-600">actualités publiées</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-8 py-12 md:grid-cols-3">
        <Link href="/games" className="rounded-xl border p-5 hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Catalogue JRPG</h2>
          <p className="mt-2 text-sm text-gray-600">
            Consulte les jeux, les séries, les plateformes et les éditions.
          </p>
        </Link>

        <Link
          href="/collection"
          className="rounded-xl border p-5 hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Ma collection</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ajoute tes jeux, filtre ton backlog et suis ta progression.
          </p>
        </Link>

        <Link
          href="/releases"
          className="rounded-xl border p-5 hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Sorties à venir</h2>
          <p className="mt-2 text-sm text-gray-600">
            Surveille les sorties PAL, physiques et numériques.
          </p>
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-8 pb-16 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Prochaines sorties</h2>
            <Link href="/releases" className="text-sm underline">
              Tout voir
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {releases.length === 0 ? (
              <div className="rounded-xl border p-5 text-sm text-gray-600">
                Aucune sortie future n’est encore renseignée.
              </div>
            ) : (
              releases.map((release) => (
                <Link
                  key={release.id}
                  href={
                    release.game ? `/games/${release.game.slug}` : "/releases"
                  }
                  className="rounded-xl border p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold">
                    {release.game?.title ?? "Jeu inconnu"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {release.platform?.name ?? "Plateforme inconnue"}
                    {release.edition_name ? ` · ${release.edition_name}` : ""}
                  </p>

                  {release.release_date && (
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(release.release_date).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Actualités</h2>
            <Link href="/news" className="text-sm underline">
              Tout voir
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {news.length === 0 ? (
              <div className="rounded-xl border p-5 text-sm text-gray-600">
                Aucune actualité n’est encore publiée.
              </div>
            ) : (
              news.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="rounded-xl border p-4 hover:bg-gray-50"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.summary}</p>

                  {item.published_at && (
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(item.published_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
