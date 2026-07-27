"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/requireAdmin";

const validGameModes = new Set([
  "solo",
  "multiplayer",
  "solo_multiplayer",
  "online",
]);

const validBattleSystems = new Set([
  "turn_based",
  "active_time",
  "action",
  "tactical",
  "real_time",
  "hybrid",
  "other",
]);

const validPartyStructures = new Set([
  "fixed_party",
  "recruitable_party",
  "customizable_party",
  "solo_character",
  "rotating_party",
  "other",
]);

const validProgressionSystems = new Set([
  "levels_equipment",
  "jobs",
  "skill_tree",
  "crafting",
  "hybrid",
  "other",
]);

const validNarrativeStructures = new Set([
  "linear",
  "branching",
  "episodic",
  "open",
  "other",
]);

const validExplorationStyles = new Set([
  "world_map",
  "zones",
  "open_world",
  "hubs",
  "dungeon_crawler",
  "other",
]);

const validDifficulties = new Set([
  "accessible",
  "standard",
  "demanding",
  "customizable",
  "other",
]);

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value ? value : null;
}

function normalizedChoice(
  formData: FormData,
  key: string,
  allowedValues: Set<string>,
) {
  const value = textValue(formData, key);

  if (!value) {
    return null;
  }

  return allowedValues.has(value) ? value : undefined;
}

function errorUrl(gameId: number, message: string) {
  return `/admin/games/${gameId}/edit?jrpg_error=${encodeURIComponent(message)}`;
}

export async function updateGameJrpgMetadata(
  gameId: number,
  formData: FormData,
) {
  if (!Number.isInteger(gameId) || gameId <= 0) {
    redirect("/admin/games?error=Identifiant%20de%20jeu%20invalide");
  }

  const gameMode = normalizedChoice(formData, "game_mode", validGameModes);
  const battleSystem = normalizedChoice(
    formData,
    "battle_system",
    validBattleSystems,
  );
  const partyStructure = normalizedChoice(
    formData,
    "party_structure",
    validPartyStructures,
  );
  const progressionSystem = normalizedChoice(
    formData,
    "progression_system",
    validProgressionSystems,
  );
  const narrativeStructure = normalizedChoice(
    formData,
    "narrative_structure",
    validNarrativeStructures,
  );
  const explorationStyle = normalizedChoice(
    formData,
    "exploration_style",
    validExplorationStyles,
  );
  const difficulty = normalizedChoice(
    formData,
    "difficulty",
    validDifficulties,
  );

  const invalidChoice = [
    gameMode,
    battleSystem,
    partyStructure,
    progressionSystem,
    narrativeStructure,
    explorationStyle,
    difficulty,
  ].some((value) => value === undefined);

  if (invalidChoice) {
    redirect(errorUrl(gameId, "Une information JRPG sélectionnée est invalide."));
  }

  const rawHours = textValue(formData, "main_story_hours");
  let mainStoryHours: number | null = null;

  if (rawHours) {
    const parsedHours = Number(rawHours);

    if (
      !Number.isInteger(parsedHours) ||
      parsedHours < 1 ||
      parsedHours > 999
    ) {
      redirect(
        errorUrl(
          gameId,
          "La durée principale doit être un nombre entier compris entre 1 et 999 heures.",
        ),
      );
    }

    mainStoryHours = parsedHours;
  }

  const { supabase } = await requireAdmin();
  const { data: currentGame, error: currentGameError } = await supabase
    .from("games")
    .select("slug")
    .eq("id", gameId)
    .single();

  if (currentGameError || !currentGame) {
    redirect(errorUrl(gameId, "Jeu introuvable."));
  }

  const { error } = await supabase
    .from("games")
    .update({
      original_title: nullableText(formData, "original_title"),
      country_of_origin: nullableText(formData, "country_of_origin"),
      game_mode: gameMode,
      battle_system: battleSystem,
      party_structure: partyStructure,
      progression_system: progressionSystem,
      narrative_structure: narrativeStructure,
      exploration_style: explorationStyle,
      difficulty,
      main_story_hours: mainStoryHours,
      available_languages: nullableText(formData, "available_languages"),
    })
    .eq("id", gameId);

  if (error) {
    redirect(errorUrl(gameId, error.message));
  }

  revalidatePath(`/admin/games/${gameId}/edit`);
  revalidatePath(`/games/${currentGame.slug}`);
  revalidatePath("/games");

  redirect(`/admin/games/${gameId}/edit?jrpg_updated=1`);
}
