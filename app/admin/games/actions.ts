"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Region = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";
type ReleaseFormat = "physical" | "digital" | "both";

type CatalogPlatformInput = {
  platform_id: number;
  region: Region;
  release_date: string | null;
  physical: boolean;
  digital: boolean;
  edition_name: string | null;
};

const validRegions = new Set<Region>([
  "PAL",
  "US",
  "JAP",
  "ASIA",
  "WORLD",
]);

const validFormats = new Set<ReleaseFormat>([
  "physical",
  "digital",
  "both",
]);

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value.length > 0 ? value : null;
}

function parseReleaseYear(formData: FormData) {
  const rawValue = textValue(formData, "release_year");

  if (!rawValue) {
    return null;
  }

  const year = Number(rawValue);

  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    return undefined;
  }

  return year;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function parseCatalogPlatforms(formData: FormData):
  | { platforms: CatalogPlatformInput[]; error: null }
  | { platforms: null; error: string } {
  const platformValues = formData.getAll("platform_id").map(String);
  const regionValues = formData.getAll("region").map(String);
  const dateValues = formData.getAll("release_date").map(String);
  const formatValues = formData.getAll("release_format").map(String);
  const editionValues = formData.getAll("edition_name").map(String);

  if (platformValues.length === 0) {
    return {
      platforms: null,
      error: "Ajoute au moins un support au jeu.",
    };
  }

  if (
    platformValues.length !== regionValues.length ||
    platformValues.length !== dateValues.length ||
    platformValues.length !== formatValues.length ||
    platformValues.length !== editionValues.length
  ) {
    return {
      platforms: null,
      error: "Le formulaire des supports est incomplet.",
    };
  }

  const platforms: CatalogPlatformInput[] = [];
  const uniqueKeys = new Set<string>();

  for (let index = 0; index < platformValues.length; index += 1) {
    const platformId = Number(platformValues[index]);
    const region = regionValues[index] as Region;
    const releaseDate = dateValues[index].trim();
    const format = formatValues[index] as ReleaseFormat;
    const editionName = editionValues[index].trim();

    if (!Number.isInteger(platformId) || platformId <= 0) {
      return {
        platforms: null,
        error: "Une plateforme sélectionnée est invalide.",
      };
    }

    if (!validRegions.has(region)) {
      return {
        platforms: null,
        error: "Une région sélectionnée est invalide.",
      };
    }

    if (!validFormats.has(format)) {
      return {
        platforms: null,
        error: "Un format sélectionné est invalide.",
      };
    }

    if (releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
      return {
        platforms: null,
        error: "Une date de sortie est invalide.",
      };
    }

    const uniqueKey = `${platformId}:${region}`;

    if (uniqueKeys.has(uniqueKey)) {
      return {
        platforms: null,
        error:
          "Le même support et la même région ne peuvent pas être ajoutés deux fois.",
      };
    }

    uniqueKeys.add(uniqueKey);

    platforms.push({
      platform_id: platformId,
      region,
      release_date: releaseDate || null,
      physical: format === "physical" || format === "both",
      digital: format === "digital" || format === "both",
      edition_name: editionName || null,
    });
  }

  return { platforms, error: null };
}

async function makeUniqueSlug(
  requestedSlug: string,
  title: string,
  ignoredGameId?: number,
) {
  const { supabase } = await requireAdmin();
  const baseSlug = slugify(requestedSlug || title) || "jeu";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = supabase
      .from("games")
      .select("id")
      .ilike("slug", candidate);

    if (ignoredGameId) {
      query = query.neq("id", ignoredGameId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { slug: null, error: error.message };
    }

    if (!data) {
      return { slug: candidate, error: null };
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function createCatalogGame(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = textValue(formData, "title");
  const releaseYear = parseReleaseYear(formData);
  const parsedPlatforms = parseCatalogPlatforms(formData);

  if (!title) {
    redirect(errorUrl("/admin/games/new", "Le titre du jeu est obligatoire."));
  }

  if (releaseYear === undefined) {
    redirect(
      errorUrl(
        "/admin/games/new",
        "L’année de sortie doit être comprise entre 1970 et 2100.",
      ),
    );
  }

  if (parsedPlatforms.error || !parsedPlatforms.platforms) {
    redirect(
      errorUrl(
        "/admin/games/new",
        parsedPlatforms.error ?? "Supports invalides.",
      ),
    );
  }

  const catalogPlatforms = parsedPlatforms.platforms;

  const uniqueSlug = await makeUniqueSlug(
    textValue(formData, "slug"),
    title,
  );

  if (!uniqueSlug.slug) {
    redirect(
      errorUrl(
        "/admin/games/new",
        `Impossible de générer le slug : ${uniqueSlug.error}`,
      ),
    );
  }

  const { data: createdGame, error: gameError } = await supabase
    .from("games")
    .insert({
      title,
      slug: uniqueSlug.slug,
      description: nullableText(formData, "description"),
      developer: nullableText(formData, "developer"),
      publisher: nullableText(formData, "publisher"),
      series: nullableText(formData, "series"),
      cover_url: nullableText(formData, "cover_url"),
      release_year: releaseYear,
    })
    .select("id, slug")
    .single();

  if (gameError || !createdGame) {
    redirect(
      errorUrl(
        "/admin/games/new",
        gameError?.message ?? "Impossible de créer le jeu.",
      ),
    );
  }

  const platformRows = catalogPlatforms.map((platform) => ({
    ...platform,
    game_id: createdGame.id,
  }));

  const { error: platformError } = await supabase
    .from("game_platforms")
    .insert(platformRows);

  if (platformError) {
    await supabase.from("games").delete().eq("id", createdGame.id);

    redirect(
      errorUrl(
        "/admin/games/new",
        `Le jeu n’a pas été enregistré : ${platformError.message}`,
      ),
    );
  }

  revalidatePath("/games");
  revalidatePath(`/games/${createdGame.slug}`);
  revalidatePath("/admin/games");

  redirect("/admin/games?created=1");
}

export async function updateCatalogGame(
  gameId: number,
  formData: FormData,
) {
  const { supabase } = await requireAdmin();
  const editPath = `/admin/games/${gameId}/edit`;

  if (!Number.isInteger(gameId) || gameId <= 0) {
    redirect(errorUrl("/admin/games", "Identifiant de jeu invalide."));
  }

  const title = textValue(formData, "title");
  const releaseYear = parseReleaseYear(formData);
  const parsedPlatforms = parseCatalogPlatforms(formData);

  if (!title) {
    redirect(errorUrl(editPath, "Le titre du jeu est obligatoire."));
  }

  if (releaseYear === undefined) {
    redirect(
      errorUrl(
        editPath,
        "L’année de sortie doit être comprise entre 1970 et 2100.",
      ),
    );
  }

  if (parsedPlatforms.error || !parsedPlatforms.platforms) {
    redirect(
      errorUrl(editPath, parsedPlatforms.error ?? "Supports invalides."),
    );
  }

  const catalogPlatforms = parsedPlatforms.platforms;

  const { data: currentGame, error: currentGameError } = await supabase
    .from("games")
    .select("id, slug")
    .eq("id", gameId)
    .single();

  if (currentGameError || !currentGame) {
    redirect(errorUrl("/admin/games", "Jeu introuvable."));
  }

  const uniqueSlug = await makeUniqueSlug(
    textValue(formData, "slug"),
    title,
    gameId,
  );

  if (!uniqueSlug.slug) {
    redirect(
      errorUrl(
        editPath,
        `Impossible de générer le slug : ${uniqueSlug.error}`,
      ),
    );
  }

  const { data: previousPlatforms, error: previousPlatformError } =
    await supabase
      .from("game_platforms")
      .select(
        "game_id, platform_id, region, release_date, physical, digital, edition_name",
      )
      .eq("game_id", gameId);

  if (previousPlatformError) {
    redirect(
      errorUrl(
        editPath,
        `Impossible de lire les supports actuels : ${previousPlatformError.message}`,
      ),
    );
  }

  const { error: gameError } = await supabase
    .from("games")
    .update({
      title,
      slug: uniqueSlug.slug,
      description: nullableText(formData, "description"),
      developer: nullableText(formData, "developer"),
      publisher: nullableText(formData, "publisher"),
      series: nullableText(formData, "series"),
      cover_url: nullableText(formData, "cover_url"),
      release_year: releaseYear,
    })
    .eq("id", gameId);

  if (gameError) {
    redirect(errorUrl(editPath, gameError.message));
  }

  const { error: deletePlatformError } = await supabase
    .from("game_platforms")
    .delete()
    .eq("game_id", gameId);

  if (deletePlatformError) {
    redirect(
      errorUrl(
        editPath,
        `Jeu modifié, mais supports non remplacés : ${deletePlatformError.message}`,
      ),
    );
  }

  const replacementRows = catalogPlatforms.map((platform) => ({
    ...platform,
    game_id: gameId,
  }));

  const { error: replacementError } = await supabase
    .from("game_platforms")
    .insert(replacementRows);

  if (replacementError) {
    if (previousPlatforms && previousPlatforms.length > 0) {
      await supabase.from("game_platforms").insert(previousPlatforms);
    }

    redirect(
      errorUrl(
        editPath,
        `Impossible de remplacer les supports : ${replacementError.message}`,
      ),
    );
  }

  revalidatePath("/games");
  revalidatePath(`/games/${currentGame.slug}`);
  revalidatePath(`/games/${uniqueSlug.slug}`);
  revalidatePath("/admin/games");
  revalidatePath(editPath);

  redirect("/admin/games?updated=1");
}

export async function deleteCatalogGame(gameId: number) {
  const { supabase } = await requireAdmin();

  if (!Number.isInteger(gameId) || gameId <= 0) {
    redirect(errorUrl("/admin/games", "Identifiant de jeu invalide."));
  }

  const { count: collectionCount, error: countError } = await supabase
    .from("user_collections")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId);

  if (countError) {
    redirect(
      errorUrl(
        "/admin/games",
        `Impossible de vérifier les collections : ${countError.message}`,
      ),
    );
  }

  if ((collectionCount ?? 0) > 0) {
    redirect(
      errorUrl(
        "/admin/games",
        "Ce jeu est présent dans une collection utilisateur. Il ne peut pas être supprimé.",
      ),
    );
  }

  const { error } = await supabase.from("games").delete().eq("id", gameId);

  if (error) {
    redirect(
      errorUrl(
        "/admin/games",
        `Impossible de supprimer le jeu : ${error.message}`,
      ),
    );
  }

  revalidatePath("/games");
  revalidatePath("/admin/games");

  redirect("/admin/games?deleted=1");
}
