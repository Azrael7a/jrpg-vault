"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function generateSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureAdmin() {
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

function revalidateReleasePages() {
  revalidatePath("/");
  revalidatePath("/releases");
  revalidatePath("/admin/releases");
}

export async function createReleaseGroup(formData: FormData) {
  const supabase = await ensureAdmin();

  const existingGameId = String(formData.get("existing_game_id") ?? "");
  const newTitle = String(formData.get("new_title") ?? "").trim();
  const newSlug = String(formData.get("new_slug") ?? "").trim();
  const newCoverUrl = String(formData.get("new_cover_url") ?? "").trim();
  const newReleaseYear = String(formData.get("new_release_year") ?? "").trim();
  const newDeveloper = String(formData.get("new_developer") ?? "").trim();
  const newPublisher = String(formData.get("new_publisher") ?? "").trim();

  const releaseDate = String(formData.get("release_date") ?? "").trim();
  const region = String(formData.get("region") ?? "PAL");
  const status = String(formData.get("status") ?? "confirmed");
  const editionName = String(formData.get("edition_name") ?? "").trim();

  const physical = formData.get("physical") === "on";
  const digital = formData.get("digital") === "on";

  const platformIds = formData
    .getAll("platform_ids")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!releaseDate) {
    throw new Error("La date de sortie est obligatoire.");
  }

  if (platformIds.length === 0) {
    throw new Error("Sélectionne au moins une plateforme.");
  }

  if (!physical && !digital) {
    throw new Error("Sélectionne au moins un format : physique ou numérique.");
  }

  let gameId = Number(existingGameId);

  if (!gameId && !newTitle) {
    throw new Error("Choisis un jeu existant ou crée un nouveau jeu.");
  }

  if (!gameId) {
    const slug = newSlug || generateSlug(newTitle);

    const { data: createdGame, error: gameError } = await supabase
      .from("games")
      .insert({
        title: newTitle,
        slug,
        cover_url: newCoverUrl || null,
        release_year: newReleaseYear ? Number(newReleaseYear) : null,
        developer: newDeveloper || null,
        publisher: newPublisher || null,
      })
      .select("id")
      .single();

    if (gameError || !createdGame) {
      throw new Error(
        gameError?.message ?? "Impossible de créer le nouveau jeu.",
      );
    }

    gameId = createdGame.id;
  }

  const releasesToInsert = platformIds.map((platformId) => ({
    game_id: gameId,
    platform_id: platformId,
    release_date: releaseDate,
    region,
    physical,
    digital,
    status,
    edition_name: editionName || null,
  }));

  const { error: releaseError } = await supabase
    .from("game_releases")
    .insert(releasesToInsert);

  if (releaseError) {
    throw new Error(releaseError.message);
  }

  revalidateReleasePages();
  redirect("/admin/releases");
}

export async function updateReleaseGroup(formData: FormData) {
  const supabase = await ensureAdmin();

  const gameId = Number(formData.get("game_id"));
  const releaseDate = String(formData.get("release_date") ?? "").trim();
  const region = String(formData.get("region") ?? "PAL");
  const status = String(formData.get("status") ?? "confirmed");
  const editionName = String(formData.get("edition_name") ?? "").trim();

  const physical = formData.get("physical") === "on";
  const digital = formData.get("digital") === "on";

  const platformIds = formData
    .getAll("platform_ids")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  if (!releaseDate) {
    throw new Error("La date de sortie est obligatoire.");
  }

  if (platformIds.length === 0) {
    throw new Error("Sélectionne au moins une plateforme.");
  }

  if (!physical && !digital) {
    throw new Error("Sélectionne au moins un format : physique ou numérique.");
  }

  const { data: existingData, error: existingError } = await supabase
    .from("game_releases")
    .select("id, platform_id")
    .eq("game_id", gameId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingReleases = (existingData ?? []) as {
    id: number;
    platform_id: number | null;
  }[];

  const idsToDelete = existingReleases
    .filter(
      (release) =>
        release.platform_id !== null && !platformIds.includes(release.platform_id),
    )
    .map((release) => release.id);

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("game_releases")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  for (const platformId of platformIds) {
    const existingRelease = existingReleases.find(
      (release) => release.platform_id === platformId,
    );

    const payload = {
      game_id: gameId,
      platform_id: platformId,
      release_date: releaseDate,
      region,
      physical,
      digital,
      status,
      edition_name: editionName || null,
    };

    if (existingRelease) {
      const { error: updateError } = await supabase
        .from("game_releases")
        .update(payload)
        .eq("id", existingRelease.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from("game_releases")
        .insert(payload);

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  revalidateReleasePages();
  redirect("/admin/releases");
}

export async function markReleaseGroupAsReleased(formData: FormData) {
  const supabase = await ensureAdmin();

  const gameId = Number(formData.get("game_id"));

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  const { error } = await supabase
    .from("game_releases")
    .update({ status: "released" })
    .eq("game_id", gameId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateReleasePages();
  redirect("/admin/releases");
}

export async function deleteReleaseGroup(formData: FormData) {
  const supabase = await ensureAdmin();

  const gameId = Number(formData.get("game_id"));

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  const { error } = await supabase
    .from("game_releases")
    .delete()
    .eq("game_id", gameId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateReleasePages();
  redirect("/admin/releases");
}
