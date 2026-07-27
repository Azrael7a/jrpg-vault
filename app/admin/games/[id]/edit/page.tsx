import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import GameCoverManager from "./GameCoverManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Game = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  series: string | null;
  cover_url: string | null;
  release_year: number | null;
};

type Tag = {
  id: number;
  name: string;
};

type GameTagRow = {
  tag_id: number | null;
  tags: Tag | Tag[] | null;
};

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
  is_legacy: boolean | null;
  display_order: number | null;
};

type GamePlatformRow = {
  id: number;
  platform_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  edition_name: string | null;
  platforms: Platform | Platform[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getBooleanFromForm(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getNullableString(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  return value.length > 0 ? value : null;
}

function getNullableNumber(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

async function getAdminClient() {
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

async function updateGame(formData: FormData) {
  "use server";

  const supabase = await getAdminClient();

  const gameId = Number(formData.get("game_id"));
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : normalizeSlug(title);

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  if (!title) {
    throw new Error("Le titre est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug est obligatoire.");
  }

  const releaseYear = getNullableNumber(formData, "release_year");

  const { error: gameError } = await supabase
    .from("games")
    .update({
      title,
      slug,
      series: getNullableString(formData, "series"),
      developer: getNullableString(formData, "developer"),
      publisher: getNullableString(formData, "publisher"),
      release_year: releaseYear,
      cover_url: getNullableString(formData, "cover_url"),
      description: getNullableString(formData, "description"),
    })
    .eq("id", gameId);

  if (gameError) {
    throw new Error(gameError.message);
  }

  const tagIds = formData
    .getAll("tag_ids")
    .map((value) => Number(value))
    .filter((value): value is number => Number.isFinite(value));

  const { error: deleteTagsError } = await supabase
    .from("game_tags")
    .delete()
    .eq("game_id", gameId);

  if (deleteTagsError) {
    throw new Error(deleteTagsError.message);
  }

  if (tagIds.length > 0) {
    const { error: insertTagsError } = await supabase.from("game_tags").insert(
      tagIds.map((tagId) => ({
        game_id: gameId,
        tag_id: tagId,
      })),
    );

    if (insertTagsError) {
      throw new Error(insertTagsError.message);
    }
  }

  revalidatePath("/games");
  revalidatePath(`/games/${slug}`);
  revalidatePath(`/admin/games/${gameId}/edit`);
}

async function addGamePlatform(formData: FormData) {
  "use server";

  const supabase = await getAdminClient();

  const gameId = Number(formData.get("game_id"));
  const platformId = Number(formData.get("platform_id"));

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  if (!Number.isFinite(platformId)) {
    throw new Error("Plateforme invalide.");
  }

  const { error } = await supabase.from("game_platforms").insert({
    game_id: gameId,
    platform_id: platformId,
    region: getNullableString(formData, "region") ?? "PAL",
    release_date: getNullableString(formData, "release_date"),
    physical: getBooleanFromForm(formData, "physical"),
    digital: getBooleanFromForm(formData, "digital"),
    edition_name: getNullableString(formData, "edition_name"),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/games");
  revalidatePath(`/admin/games/${gameId}/edit`);
}

async function deleteGamePlatform(formData: FormData) {
  "use server";

  const supabase = await getAdminClient();

  const gameId = Number(formData.get("game_id"));
  const relationId = Number(formData.get("relation_id"));

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  if (!Number.isFinite(relationId)) {
    throw new Error("Support invalide.");
  }

  const { error } = await supabase
    .from("game_platforms")
    .delete()
    .eq("id", relationId)
    .eq("game_id", gameId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/games");
  revalidatePath(`/admin/games/${gameId}/edit`);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function AdminSection({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
        </div>

        {action}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function formatReleaseFormat(physical: boolean | null, digital: boolean | null) {
  if (physical && digital) {
    return "Physique + numérique";
  }

  if (physical) {
    return "Physique";
  }

  if (digital) {
    return "Numérique";
  }

  return "Format inconnu";
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gameId = Number(id);

  if (!Number.isFinite(gameId)) {
    notFound();
  }

  const supabase = await getAdminClient();

  const [
    gameResult,
    tagsResult,
    gameTagsResult,
    platformsResult,
    gamePlatformsResult,
  ] = await Promise.all([
    supabase
      .from("games")
      .select(
        `
        id,
        title,
        slug,
        description,
        developer,
        publisher,
        series,
        cover_url,
        release_year
      `,
      )
      .eq("id", gameId)
      .maybeSingle(),

    supabase.from("tags").select("id, name").order("name", { ascending: true }),

    supabase
      .from("game_tags")
      .select(
        `
        tag_id,
        tags (
          id,
          name
        )
      `,
      )
      .eq("game_id", gameId),

    supabase
      .from("platforms")
      .select("id, name, manufacturer, is_legacy, display_order")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),

    supabase
      .from("game_platforms")
      .select(
        `
        id,
        platform_id,
        region,
        release_date,
        physical,
        digital,
        edition_name,
        platforms (
          id,
          name,
          manufacturer,
          is_legacy,
          display_order
        )
      `,
      )
      .eq("game_id", gameId)
      .order("release_date", { ascending: true }),
  ]);

  if (gameResult.error || !gameResult.data) {
    notFound();
  }

  if (tagsResult.error) {
    console.error("Erreur chargement tags :", tagsResult.error);
  }

  if (gameTagsResult.error) {
    console.error("Erreur chargement tags du jeu :", gameTagsResult.error);
  }

  if (platformsResult.error) {
    console.error("Erreur chargement plateformes :", platformsResult.error);
  }

  if (gamePlatformsResult.error) {
    console.error("Erreur chargement supports du jeu :", gamePlatformsResult.error);
  }

  const game = gameResult.data as Game;
  const tags = (tagsResult.data ?? []) as Tag[];
  const platforms = (platformsResult.data ?? []) as Platform[];

  const assignedTagIds = new Set(
    ((gameTagsResult.data ?? []) as unknown as GameTagRow[])
      .map((item) => item.tag_id)
      .filter((tagId): tagId is number => typeof tagId === "number"),
  );

  const gamePlatforms = ((gamePlatformsResult.data ?? []) as unknown as GamePlatformRow[])
    .map((item) => ({
      id: item.id,
      platform_id: item.platform_id,
      region: item.region,
      release_date: item.release_date,
      physical: item.physical,
      digital: item.digital,
      edition_name: item.edition_name,
      platform: normalizeRelation(item.platforms),
    }))
    .filter((item) => item.platform);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/games"
              className="text-sm font-medium text-purple-300 underline underline-offset-4 hover:text-purple-200"
            >
              ← Retour aux jeux admin
            </Link>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
              Modifier {game.title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Mets à jour les informations générales, les tags, les plateformes
              et les jaquettes régionales du jeu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${game.slug}`}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-purple-500 hover:text-white"
            >
              Voir la fiche publique
            </Link>

            <Link
              href="/games"
              className="rounded-xl border border-purple-500/70 bg-purple-950/40 px-4 py-2 text-sm font-semibold text-purple-200 hover:bg-purple-900/50 hover:text-white"
            >
              Catalogue
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-8">
            <AdminSection eyebrow="Fiche" title="Informations principales">
              <form action={updateGame} className="grid gap-6">
                <input type="hidden" name="game_id" value={game.id} />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Titre">
                    <input
                      name="title"
                      defaultValue={game.title}
                      required
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Slug">
                    <input
                      name="slug"
                      defaultValue={game.slug}
                      required
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Série">
                    <input
                      name="series"
                      defaultValue={game.series ?? ""}
                      placeholder="Ex : .hack"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Année de sortie">
                    <input
                      name="release_year"
                      type="number"
                      min="1970"
                      max="2100"
                      defaultValue={game.release_year ?? ""}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Développeur">
                    <input
                      name="developer"
                      defaultValue={game.developer ?? ""}
                      placeholder="Ex : CyberConnect2"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Éditeur">
                    <input
                      name="publisher"
                      defaultValue={game.publisher ?? ""}
                      placeholder="Ex : Bandai"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    />
                  </Field>
                </div>

                <Field label="Jaquette principale de secours">
                  <input
                    name="cover_url"
                    defaultValue={game.cover_url ?? ""}
                    placeholder="https://..."
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    name="description"
                    defaultValue={game.description ?? ""}
                    rows={10}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-7 text-white"
                  />
                </Field>

                <div>
                  <p className="text-sm font-semibold text-slate-200">Tags</p>

                  {tags.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                      Aucun tag disponible.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200"
                        >
                          <input
                            type="checkbox"
                            name="tag_ids"
                            value={tag.id}
                            defaultChecked={assignedTagIds.has(tag.id)}
                            className="h-4 w-4 rounded border-slate-700"
                          />

                          <span>{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-800 pt-6">
                  <Link
                    href={`/games/${game.slug}`}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-purple-500 hover:text-white"
                  >
                    Annuler
                  </Link>

                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 hover:bg-purple-500"
                  >
                    Enregistrer la fiche
                  </button>
                </div>
              </form>
            </AdminSection>

            <AdminSection eyebrow="Supports" title="Plateformes et versions">
              {gamePlatforms.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                  Aucune plateforme n’est encore associée à ce jeu.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <div className="hidden grid-cols-[1.1fr_0.7fr_0.8fr_0.9fr_1fr_auto] gap-4 border-b border-slate-800 bg-slate-950 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                    <span>Plateforme</span>
                    <span>Région</span>
                    <span>Format</span>
                    <span>Date</span>
                    <span>Édition</span>
                    <span />
                  </div>

                  <div className="divide-y divide-slate-800 bg-slate-950/60">
                    {gamePlatforms.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 px-5 py-4 md:grid-cols-[1.1fr_0.7fr_0.8fr_0.9fr_1fr_auto] md:items-center"
                      >
                        <div className="text-sm font-semibold text-white">
                          {item.platform?.name ?? "Plateforme inconnue"}
                        </div>

                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500 md:hidden">
                            Région :{" "}
                          </span>
                          {item.region ?? "Inconnue"}
                        </div>

                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500 md:hidden">
                            Format :{" "}
                          </span>
                          {formatReleaseFormat(item.physical, item.digital)}
                        </div>

                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500 md:hidden">
                            Date :{" "}
                          </span>
                          {formatDate(item.release_date)}
                        </div>

                        <div className="text-sm text-slate-300">
                          <span className="text-slate-500 md:hidden">
                            Édition :{" "}
                          </span>
                          {item.edition_name ?? "Standard"}
                        </div>

                        <form action={deleteGamePlatform}>
                          <input type="hidden" name="game_id" value={game.id} />
                          <input
                            type="hidden"
                            name="relation_id"
                            value={item.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900/40"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form
                action={addGamePlatform}
                className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <input type="hidden" name="game_id" value={game.id} />

                <h3 className="text-lg font-bold text-white">
                  Ajouter une plateforme
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Plateforme">
                    <select
                      name="platform_id"
                      required
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                    >
                      <option value="">Choisir une plateforme</option>
                      {platforms.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Région">
                    <select
                      name="region"
                      defaultValue="PAL"
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                    >
                      <option value="PAL">PAL</option>
                      <option value="US">US</option>
                      <option value="JAP">JAP</option>
                      <option value="ASIA">ASIA</option>
                      <option value="WORLD">WORLD</option>
                    </select>
                  </Field>

                  <Field label="Date de sortie">
                    <input
                      name="release_date"
                      type="date"
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                    />
                  </Field>

                  <Field label="Édition">
                    <input
                      name="edition_name"
                      placeholder="Standard, Collector..."
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                    />
                  </Field>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      name="physical"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    Physique
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                    <input type="checkbox" name="digital" className="h-4 w-4" />
                    Numérique
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
                >
                  Ajouter la plateforme
                </button>
              </form>
            </AdminSection>

            <GameCoverManager gameId={game.id} />
          </div>

          <aside className="grid content-start gap-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
                Aperçu
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                Jaquette principale
              </h2>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={`Jaquette de ${game.title}`}
                    className="aspect-[3/4] w-full object-contain"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center px-6 text-center text-lg font-bold text-purple-300">
                    JRPG Vault
                    <br />
                    {game.title}
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                Cette image reste la jaquette de secours. Si des jaquettes PAL,
                US ou JAP existent dans le bloc régional, la fiche publique les
                utilisera en priorité.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
                Liens rapides
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href={`/games/${game.slug}`}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
                >
                  Voir la fiche publique
                </Link>

                <Link
                  href="/admin/games"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
                >
                  Retour liste admin
                </Link>

                <Link
                  href="/games"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-purple-500"
                >
                  Catalogue public
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
