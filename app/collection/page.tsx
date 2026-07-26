import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionFormat = "physical" | "digital" | "both";

type GameRelation = {
  id: number;
  title: string;
  slug: string;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type RawCollectionItem = {
  id: number;
  status: CollectionStatus | null;
  format: CollectionFormat | null;
  region: string | null;
  personal_rating: number | null;
  notes: string | null;
  created_at: string | null;
  games: GameRelation | GameRelation[] | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type CollectionItem = {
  id: number;
  status: CollectionStatus;
  format: CollectionFormat;
  region: string | null;
  personal_rating: number | null;
  notes: string | null;
  created_at: string | null;
  game: GameRelation;
  platform: PlatformRelation | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    platform?: string;
    format?: string;
    region?: string;
  }>;
};

const statusOptions: Array<{ value: CollectionStatus; label: string }> = [
  { value: "owned", label: "Possédé" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "backlog", label: "Backlog" },
  { value: "wishlist", label: "Wishlist" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
];

const formatOptions: Array<{ value: CollectionFormat; label: string }> = [
  { value: "physical", label: "Physique" },
  { value: "digital", label: "Numérique" },
  { value: "both", label: "Physique + numérique" },
];

const regionOptions = ["PAL", "US", "JAP", "ASIA", "WORLD"];

const statusBadgeClasses: Record<CollectionStatus, string> = {
  owned: "border-blue-500/40 bg-blue-950/80 text-blue-200",
  playing: "border-green-500/40 bg-green-950/80 text-green-200",
  completed: "border-purple-500/40 bg-purple-950/80 text-purple-200",
  backlog: "border-orange-500/40 bg-orange-950/80 text-orange-200",
  wishlist: "border-pink-500/40 bg-pink-950/80 text-pink-200",
  preordered: "border-cyan-500/40 bg-cyan-950/80 text-cyan-200",
  abandoned: "border-slate-500/40 bg-slate-800/90 text-slate-200",
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function isCollectionStatus(value: string): value is CollectionStatus {
  return statusOptions.some((option) => option.value === value);
}

function isCollectionFormat(value: string): value is CollectionFormat {
  return formatOptions.some((option) => option.value === value);
}

function getStatusLabel(status: CollectionStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function getFormatLabel(format: CollectionFormat) {
  return formatOptions.find((option) => option.value === format)?.label ?? format;
}

function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getPlatformTagClass(platformName: string | null | undefined) {
  const name = normalizeSearchText(platformName);

  if (
    name.includes("nintendo") ||
    name.includes("switch") ||
    name.includes("game boy") ||
    name.includes("gameboy") ||
    name.includes("ds") ||
    name.includes("3ds") ||
    name === "nes" ||
    name === "snes" ||
    name.includes("n64") ||
    name.includes("gamecube") ||
    name.includes("wii")
  ) {
    return "border-[#E60012] bg-[#E60012] text-white";
  }

  if (
    name.includes("playstation") ||
    name.includes("ps1") ||
    name.includes("ps2") ||
    name.includes("ps3") ||
    name.includes("ps4") ||
    name.includes("ps5") ||
    name.includes("psp") ||
    name.includes("vita")
  ) {
    return "border-[#0070CC] bg-[#0070CC] text-white";
  }

  if (name.includes("xbox")) {
    return "border-[#107C10] bg-[#107C10] text-white";
  }

  if (name === "pc" || name.includes("windows") || name.includes("steam")) {
    return "border-black bg-black text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function normalizeCollectionItems(rawItems: RawCollectionItem[]) {
  return rawItems
    .map((item): CollectionItem | null => {
      const game = normalizeRelation(item.games);
      const platform = normalizeRelation(item.platforms);

      if (!game) {
        return null;
      }

      return {
        id: item.id,
        status: item.status ?? "owned",
        format: item.format ?? "physical",
        region: item.region,
        personal_rating: item.personal_rating,
        notes: item.notes,
        created_at: item.created_at,
        game,
        platform,
      };
    })
    .filter((item): item is CollectionItem => item !== null);
}

function getStats(items: CollectionItem[]) {
  const stats: Record<CollectionStatus, number> = {
    owned: 0,
    playing: 0,
    completed: 0,
    backlog: 0,
    wishlist: 0,
    preordered: 0,
    abandoned: 0,
  };

  for (const item of items) {
    stats[item.status] += 1;
  }

  return stats;
}

function filterCollectionItems({
  items,
  query,
  status,
  platform,
  format,
  region,
}: {
  items: CollectionItem[];
  query: string;
  status: string;
  platform: string;
  format: string;
  region: string;
}) {
  const normalizedQuery = normalizeSearchText(query);

  return items.filter((item) => {
    const searchableText = normalizeSearchText(
      [
        item.game.title,
        item.game.series,
        item.game.developer,
        item.game.publisher,
        item.platform?.name,
        item.region,
      ]
        .filter(Boolean)
        .join(" "),
    );

    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    const matchesStatus = status === "all" || item.status === status;

    const matchesPlatform =
      platform === "all" || item.platform?.id.toString() === platform;

    const matchesFormat = format === "all" || item.format === format;

    const matchesRegion = region === "all" || item.region === region;

    return (
      matchesQuery &&
      matchesStatus &&
      matchesPlatform &&
      matchesFormat &&
      matchesRegion
    );
  });
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { supabase, user };
}

export async function updateCollectionStatus(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const collectionId = Number(formData.get("collection_id"));
  const status = String(formData.get("status") ?? "");

  if (!Number.isFinite(collectionId)) {
    throw new Error("Entrée de collection invalide.");
  }

  if (!isCollectionStatus(status)) {
    throw new Error("Statut invalide.");
  }

  const { error } = await supabase
    .from("user_collections")
    .update({ status })
    .eq("id", collectionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collection");
}

export async function removeCollectionItem(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const collectionId = Number(formData.get("collection_id"));

  if (!Number.isFinite(collectionId)) {
    throw new Error("Entrée de collection invalide.");
  }

  const { error } = await supabase
    .from("user_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/collection");
}

export default async function CollectionPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const query = resolvedSearchParams.q ?? "";
  const activeStatus = isCollectionStatus(resolvedSearchParams.status ?? "")
    ? resolvedSearchParams.status!
    : "all";
  const activePlatform = resolvedSearchParams.platform ?? "all";
  const activeFormat = isCollectionFormat(resolvedSearchParams.format ?? "")
    ? resolvedSearchParams.format!
    : "all";
  const activeRegion = regionOptions.includes(resolvedSearchParams.region ?? "")
    ? resolvedSearchParams.region!
    : "all";

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_collections")
    .select(
      `
      id,
      status,
      format,
      region,
      personal_rating,
      notes,
      created_at,
      games (
        id,
        title,
        slug,
        series,
        release_year,
        cover_url,
        developer,
        publisher
      ),
      platforms (
        id,
        name,
        manufacturer
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const collectionItems = normalizeCollectionItems(
    (data ?? []) as unknown as RawCollectionItem[],
  );

  const stats = getStats(collectionItems);

  const platformOptions = Array.from(
    new Map(
      collectionItems
        .filter((item) => item.platform)
        .map((item) => [
          item.platform!.id,
          {
            id: item.platform!.id,
            name: item.platform!.name,
          },
        ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const filteredItems = filterCollectionItems({
    items: collectionItems,
    query,
    status: activeStatus,
    platform: activePlatform,
    format: activeFormat,
    region: activeRegion,
  });

  const completionRate =
    collectionItems.length > 0
      ? Math.round((stats.completed / collectionItems.length) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-12">
          <p className="inline-flex rounded-full border border-purple-500/50 bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-200">
            Mon Vault
          </p>

          <h1 className="mt-5 text-4xl font-bold text-white">Ma collection</h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            Suis tes JRPG possédés, en cours, terminés, en backlog, en wishlist
            ou précommandés.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">
                {collectionItems.length}
              </p>
              <p className="mt-1 text-sm text-slate-400">Total</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">
                {stats.completed}
              </p>
              <p className="mt-1 text-sm text-slate-400">Terminés</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">{stats.playing}</p>
              <p className="mt-1 text-sm text-slate-400">En cours</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">{stats.backlog}</p>
              <p className="mt-1 text-sm text-slate-400">Backlog</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">{stats.wishlist}</p>
              <p className="mt-1 text-sm text-slate-400">Wishlist</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-3xl font-bold text-white">
                {completionRate}%
              </p>
              <p className="mt-1 text-sm text-slate-400">Progression</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-8 py-10">
        {error && (
          <div className="mb-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">
            Erreur pendant le chargement de la collection : {error.message}
          </div>
        )}

        <form
          action="/collection"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl"
        >
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">
                Recherche
              </span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Final Fantasy, Xenoblade, PlayStation, rétro..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-purple-500"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Statut</span>
              <select
                name="status"
                defaultValue={activeStatus}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
              >
                <option value="all">Tous</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">
                Plateforme
              </span>
              <select
                name="platform"
                defaultValue={activePlatform}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
              >
                <option value="all">Toutes</option>
                {platformOptions.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Format</span>
              <select
                name="format"
                defaultValue={activeFormat}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
              >
                <option value="all">Tous</option>
                {formatOptions.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Région</span>
              <select
                name="region"
                defaultValue={activeRegion}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
              >
                <option value="all">Toutes</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-500"
              >
                Filtrer
              </button>

              <Link
                href="/collection"
                className="rounded border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
              >
                Réinitialiser les filtres
              </Link>

              <p className="text-sm text-slate-400">
                {filteredItems.length} jeu(x) affiché(s) sur{" "}
                {collectionItems.length}
              </p>
            </div>
          </div>
        </form>

        {filteredItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
            <h2 className="text-2xl font-bold text-white">
              Aucun jeu trouvé
            </h2>

            <p className="mt-3 text-slate-400">
              Aucun jeu ne correspond aux filtres sélectionnés.
            </p>

            <Link
              href="/collection"
              className="mt-6 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl transition hover:border-purple-500"
              >
                <Link href={`/games/${item.game.slug}`} className="block">
                  <div className="relative aspect-[3/4] bg-slate-950">
                    {item.game.cover_url ? (
                      <img
                        src={item.game.cover_url}
                        alt={`Jaquette de ${item.game.title}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-6 text-center text-xl font-bold text-purple-300">
                        {item.game.title}
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex max-w-[90%] flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses[item.status]}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>

                      {item.platform && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPlatformTagClass(
                            item.platform.name,
                          )}`}
                        >
                          {item.platform.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <Link href={`/games/${item.game.slug}`}>
                    <h2 className="line-clamp-2 text-xl font-bold leading-tight text-white hover:text-purple-300">
                      {item.game.title}
                    </h2>
                  </Link>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-300">
                      {getFormatLabel(item.format)}
                    </span>

                    {item.region && (
                      <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-300">
                        {item.region}
                      </span>
                    )}

                    {item.game.release_year && (
                      <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-medium text-slate-300">
                        {item.game.release_year}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 min-h-12 text-sm text-slate-400">
                    {item.game.series && <p>Série : {item.game.series}</p>}
                    {item.game.developer && (
                      <p>Développeur : {item.game.developer}</p>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-slate-800 pt-4">
                    <form action={updateCollectionStatus} className="grid gap-2">
                      <input
                        type="hidden"
                        name="collection_id"
                        value={item.id}
                      />

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-white">
                          Statut
                        </span>

                        <select
                          name="status"
                          defaultValue={item.status}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-purple-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="rounded border border-purple-500 px-3 py-2 text-sm font-medium text-purple-200 hover:bg-purple-950"
                      >
                        Mettre à jour
                      </button>
                    </form>

                    <div className="flex gap-3">
                      <Link
                        href={`/games/${item.game.slug}`}
                        className="flex-1 rounded border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 hover:border-purple-500"
                      >
                        Voir la fiche
                      </Link>

                      <form action={removeCollectionItem}>
                        <input
                          type="hidden"
                          name="collection_id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          className="rounded border border-red-900/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950/60"
                        >
                          Retirer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
