import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ITEMS_PER_PAGE = 60;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    tag?: string;
    collection?: string;
    sort?: string;
    view?: string;
    quality?: string;
    limit?: string;
  }>;
};

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type ViewMode = "cards" | "compact";

type QualityFilter =
  | "all"
  | "missing-cover"
  | "missing-platform"
  | "missing-description";

type TagRelation = {
  id: number;
  name: string;
};

type PlatformRelation = {
  id: number;
  name: string;
  manufacturer: string | null;
};

type GameTagRelation = {
  tags: TagRelation | TagRelation[] | null;
};

type RawGame = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  game_tags: GameTagRelation[] | null;
};

type GamePlatformRow = {
  game_id: number | null;
  platform_id: number | null;
};

type CollectionRow = {
  game_id: number | null;
  status: string | null;
};

type Game = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  series: string | null;
  release_year: number | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  tags: TagRelation[];
  platforms: PlatformRelation[];
  collection_status: string | null;
};

type PlatformFilter = {
  value: string;
  label: string;
};

const addStatusOptions: Array<{ value: CollectionStatus; label: string }> = [
  { value: "wishlist", label: "Wishlist" },
  { value: "owned", label: "Possédé" },
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
];

const collectionStatusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "not-added", label: "Non ajouté" },
  { value: "added", label: "Déjà ajouté" },
  ...addStatusOptions,
];

const sortOptions = [
  { value: "title-asc", label: "Nom A-Z" },
  { value: "title-desc", label: "Nom Z-A" },
  { value: "year-desc", label: "Année récente" },
  { value: "year-asc", label: "Année ancienne" },
];

const qualityFilterOptions: Array<{ value: QualityFilter; label: string }> = [
  { value: "all", label: "Toutes les fiches" },
  { value: "missing-cover", label: "Sans jaquette" },
  { value: "missing-platform", label: "Sans plateforme" },
  { value: "missing-description", label: "Sans description" },
];

function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isCollectionStatus(value: string): value is CollectionStatus {
  return addStatusOptions.some((option) => option.value === value);
}

function getViewMode(value: string | undefined): ViewMode {
  return value === "compact" ? "compact" : "cards";
}

function getQualityFilter(value: string | undefined): QualityFilter {
  if (
    value === "missing-cover" ||
    value === "missing-platform" ||
    value === "missing-description"
  ) {
    return value;
  }

  return "all";
}

function getDisplayLimit(value: string | undefined) {
  const parsedLimit = Number(value);

  if (!Number.isFinite(parsedLimit)) {
    return ITEMS_PER_PAGE;
  }

  return Math.max(ITEMS_PER_PAGE, Math.min(2000, Math.floor(parsedLimit)));
}

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function isNintendoPlatform(name: string | null | undefined) {
  const normalizedName = normalizeText(name);

  return (
    normalizedName.includes("nintendo") ||
    normalizedName.includes("switch") ||
    normalizedName.includes("game boy") ||
    normalizedName.includes("gameboy") ||
    normalizedName.includes("gba") ||
    normalizedName.includes("ds") ||
    normalizedName.includes("3ds") ||
    normalizedName === "nes" ||
    normalizedName === "snes" ||
    normalizedName.includes("nintendo 64") ||
    normalizedName.includes("n64") ||
    normalizedName.includes("gamecube") ||
    normalizedName.includes("game cube") ||
    normalizedName.includes("wii")
  );
}

function isPlayStationPlatform(name: string | null | undefined) {
  const normalizedName = normalizeText(name);

  return (
    normalizedName.includes("playstation") ||
    normalizedName.includes("ps1") ||
    normalizedName.includes("ps2") ||
    normalizedName.includes("ps3") ||
    normalizedName.includes("ps4") ||
    normalizedName.includes("ps5") ||
    normalizedName.includes("psp") ||
    normalizedName.includes("vita")
  );
}

function isXboxPlatform(name: string | null | undefined) {
  return normalizeText(name).includes("xbox");
}

function isPcPlatform(name: string | null | undefined) {
  const normalizedName = normalizeText(name);

  return (
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  );
}

function isRetroPlatform(name: string | null | undefined) {
  const normalizedName = normalizeText(name);

  return (
    normalizedName.includes("game boy") ||
    normalizedName.includes("gameboy") ||
    normalizedName.includes("gba") ||
    normalizedName.includes("ds") ||
    normalizedName.includes("3ds") ||
    normalizedName === "nes" ||
    normalizedName === "snes" ||
    normalizedName.includes("nintendo 64") ||
    normalizedName.includes("n64") ||
    normalizedName.includes("gamecube") ||
    normalizedName.includes("game cube") ||
    normalizedName === "wii" ||
    normalizedName === "wii u" ||
    normalizedName.includes("playstation 2") ||
    normalizedName.includes("playstation 3") ||
    normalizedName.includes("ps2") ||
    normalizedName.includes("ps3") ||
    normalizedName.includes("psp") ||
    normalizedName.includes("vita") ||
    normalizedName === "xbox" ||
    normalizedName.includes("xbox 360")
  );
}

function getPlatformFamily(platformName: string) {
  if (isNintendoPlatform(platformName)) return "nintendo";
  if (isPcPlatform(platformName)) return "pc";
  if (isPlayStationPlatform(platformName)) return "playstation";
  if (isXboxPlatform(platformName)) return "xbox";
  return "other";
}

function getPlatformTagClass(platformName: string | null | undefined) {
  if (isNintendoPlatform(platformName)) {
    return "border-[#E60012] bg-[#E60012] text-white";
  }

  if (isPlayStationPlatform(platformName)) {
    return "border-[#0070CC] bg-[#0070CC] text-white";
  }

  if (isXboxPlatform(platformName)) {
    return "border-[#107C10] bg-[#107C10] text-white";
  }

  if (isPcPlatform(platformName)) {
    return "border-black bg-black text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getCollectionStatusLabel(status: string | null) {
  switch (status) {
    case "owned":
      return "Possédé";
    case "playing":
      return "En cours";
    case "completed":
      return "Terminé";
    case "backlog":
      return "Backlog";
    case "wishlist":
      return "Wishlist";
    case "preordered":
      return "Précommandé";
    case "abandoned":
      return "Abandonné";
    default:
      return "Non ajouté";
  }
}

function getCollectionStatusClass(status: string | null) {
  switch (status) {
    case "owned":
      return "border-blue-500/40 bg-blue-950/80 text-blue-200";
    case "playing":
      return "border-green-500/40 bg-green-950/80 text-green-200";
    case "completed":
      return "border-purple-500/40 bg-purple-950/80 text-purple-200";
    case "backlog":
      return "border-orange-500/40 bg-orange-950/80 text-orange-200";
    case "wishlist":
      return "border-pink-500/40 bg-pink-950/80 text-pink-200";
    case "preordered":
      return "border-cyan-500/40 bg-cyan-950/80 text-cyan-200";
    case "abandoned":
      return "border-slate-500/40 bg-slate-800/90 text-slate-200";
    default:
      return "border-slate-600 bg-slate-800/90 text-slate-300";
  }
}

function getDefaultCollectionSettings(platformName: string) {
  if (isPcPlatform(platformName)) {
    return {
      format: "digital",
      region: "WORLD",
    };
  }

  return {
    format: "physical",
    region: "PAL",
  };
}

function buildGamesUrl({
  q,
  platform,
  tag,
  collection,
  sort,
  view,
  quality,
  limit,
}: {
  q: string;
  platform: string;
  tag: string;
  collection: string;
  sort: string;
  view: ViewMode;
  quality: QualityFilter;
  limit: number;
}) {
  const params = new URLSearchParams();

  if (q.trim()) params.set("q", q.trim());
  if (platform !== "all") params.set("platform", platform);
  if (tag !== "all") params.set("tag", tag);
  if (collection !== "all") params.set("collection", collection);
  if (sort !== "title-asc") params.set("sort", sort);
  if (view !== "cards") params.set("view", view);
  if (quality !== "all") params.set("quality", quality);
  if (limit > ITEMS_PER_PAGE) params.set("limit", limit.toString());

  const queryString = params.toString();

  return queryString ? `/games?${queryString}` : "/games";
}

async function fetchPlatformsForGames({
  supabase,
  gameIds,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  gameIds: number[];
}) {
  const platformsByGameId = new Map<number, PlatformRelation[]>();

  if (gameIds.length === 0) {
    return platformsByGameId;
  }

  const { data: gamePlatformData, error: gamePlatformError } = await supabase
    .from("game_platforms")
    .select("game_id, platform_id")
    .in("game_id", gameIds);

  if (gamePlatformError) {
    console.error(
      "Erreur pendant le chargement de game_platforms :",
      gamePlatformError.message,
    );

    return platformsByGameId;
  }

  const gamePlatformRows =
    (gamePlatformData ?? []) as unknown as GamePlatformRow[];

  const platformIds = Array.from(
    new Set(
      gamePlatformRows
        .map((row) => row.platform_id)
        .filter(
          (platformId): platformId is number => typeof platformId === "number",
        ),
    ),
  );

  if (platformIds.length === 0) {
    return platformsByGameId;
  }

  const { data: platformData, error: platformError } = await supabase
    .from("platforms")
    .select("id, name, manufacturer")
    .in("id", platformIds);

  if (platformError) {
    console.error(
      "Erreur pendant le chargement des plateformes :",
      platformError.message,
    );

    return platformsByGameId;
  }

  const platformsById = new Map<number, PlatformRelation>();

  for (const platform of (platformData ?? []) as unknown as PlatformRelation[]) {
    platformsById.set(platform.id, platform);
  }

  for (const row of gamePlatformRows) {
    if (!row.game_id || !row.platform_id) {
      continue;
    }

    const platform = platformsById.get(row.platform_id);

    if (!platform) {
      continue;
    }

    const existingPlatforms = platformsByGameId.get(row.game_id) ?? [];

    if (
      !existingPlatforms.some(
        (existingPlatform) => existingPlatform.id === platform.id,
      )
    ) {
      existingPlatforms.push(platform);
    }

    platformsByGameId.set(row.game_id, existingPlatforms);
  }

  return platformsByGameId;
}

async function fetchCollectionStatuses({
  supabase,
  userId,
  gameIds,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string | null;
  gameIds: number[];
}) {
  const collectionStatusByGameId = new Map<number, string | null>();

  if (!userId || gameIds.length === 0) {
    return collectionStatusByGameId;
  }

  const { data, error } = await supabase
    .from("user_collections")
    .select("game_id, status")
    .eq("user_id", userId)
    .in("game_id", gameIds);

  if (error) {
    console.error(
      "Erreur pendant le chargement des statuts de collection :",
      error.message,
    );

    return collectionStatusByGameId;
  }

  for (const row of (data ?? []) as unknown as CollectionRow[]) {
    if (typeof row.game_id !== "number") {
      continue;
    }

    if (!collectionStatusByGameId.has(row.game_id)) {
      collectionStatusByGameId.set(row.game_id, row.status);
    }
  }

  return collectionStatusByGameId;
}

function normalizeGames({
  rawGames,
  platformsByGameId,
  collectionStatusByGameId,
}: {
  rawGames: RawGame[];
  platformsByGameId: Map<number, PlatformRelation[]>;
  collectionStatusByGameId: Map<number, string | null>;
}) {
  return rawGames.map((game): Game => {
    const tags = (game.game_tags ?? [])
      .map((relation) => normalizeRelation(relation.tags))
      .filter((tag): tag is TagRelation => tag !== null);

    const platforms = (platformsByGameId.get(game.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, "fr"),
    );

    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      description: game.description,
      series: game.series,
      release_year: game.release_year,
      cover_url: game.cover_url,
      developer: game.developer,
      publisher: game.publisher,
      tags,
      platforms,
      collection_status: collectionStatusByGameId.get(game.id) ?? null,
    };
  });
}

function getPlatformFilters(games: Game[]): PlatformFilter[] {
  const filters: PlatformFilter[] = [
    { value: "all", label: "Toutes les plateformes" },
    { value: "nintendo", label: "Nintendo" },
    { value: "playstation", label: "PlayStation" },
    { value: "xbox", label: "Xbox" },
    { value: "pc", label: "PC" },
    { value: "retro", label: "Rétro" },
  ];

  const platformMap = new Map<string, string>();

  for (const game of games) {
    for (const platform of game.platforms) {
      platformMap.set(platform.id.toString(), platform.name);
    }
  }

  const exactPlatforms = Array.from(platformMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return [...filters, ...exactPlatforms];
}

function getTagFilters(games: Game[]) {
  const tagMap = new Map<number, string>();

  for (const game of games) {
    for (const tag of game.tags) {
      tagMap.set(tag.id, tag.name);
    }
  }

  return Array.from(tagMap.entries())
    .map(([id, name]) => ({
      value: id.toString(),
      label: name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

function platformMatchesFilter(game: Game, activePlatform: string) {
  if (activePlatform === "all") return true;

  if (activePlatform === "nintendo") {
    return game.platforms.some((platform) => isNintendoPlatform(platform.name));
  }

  if (activePlatform === "playstation") {
    return game.platforms.some((platform) =>
      isPlayStationPlatform(platform.name),
    );
  }

  if (activePlatform === "xbox") {
    return game.platforms.some((platform) => isXboxPlatform(platform.name));
  }

  if (activePlatform === "pc") {
    return game.platforms.some((platform) => isPcPlatform(platform.name));
  }

  if (activePlatform === "retro") {
    return game.platforms.some((platform) => isRetroPlatform(platform.name));
  }

  return game.platforms.some(
    (platform) => platform.id.toString() === activePlatform,
  );
}

function tagMatchesFilter(game: Game, activeTag: string) {
  if (activeTag === "all") return true;

  return game.tags.some((tag) => tag.id.toString() === activeTag);
}

function collectionMatchesFilter(game: Game, activeCollection: string) {
  if (activeCollection === "all") return true;

  if (activeCollection === "not-added") {
    return game.collection_status === null;
  }

  if (activeCollection === "added") {
    return game.collection_status !== null;
  }

  return game.collection_status === activeCollection;
}

function qualityMatchesFilter(game: Game, activeQuality: QualityFilter) {
  switch (activeQuality) {
    case "missing-cover":
      return !game.cover_url;
    case "missing-platform":
      return game.platforms.length === 0;
    case "missing-description":
      return !game.description || game.description.trim().length === 0;
    case "all":
    default:
      return true;
  }
}

function filterGames({
  games,
  query,
  activePlatform,
  activeTag,
  activeCollection,
  activeQuality,
}: {
  games: Game[];
  query: string;
  activePlatform: string;
  activeTag: string;
  activeCollection: string;
  activeQuality: QualityFilter;
}) {
  const normalizedQuery = normalizeText(query);

  return games.filter((game) => {
    const searchableText = normalizeText(
      [
        game.title,
        game.series,
        game.developer,
        game.publisher,
        game.release_year?.toString(),
        ...game.tags.map((tag) => tag.name),
        ...game.platforms.map((platform) => platform.name),
      ]
        .filter(Boolean)
        .join(" "),
    );

    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return (
      matchesQuery &&
      platformMatchesFilter(game, activePlatform) &&
      tagMatchesFilter(game, activeTag) &&
      collectionMatchesFilter(game, activeCollection) &&
      qualityMatchesFilter(game, activeQuality)
    );
  });
}

function sortGames(games: Game[], sort: string) {
  return [...games].sort((a, b) => {
    switch (sort) {
      case "title-desc":
        return b.title.localeCompare(a.title, "fr");
      case "year-desc":
        return (b.release_year ?? 0) - (a.release_year ?? 0);
      case "year-asc":
        return (a.release_year ?? 9999) - (b.release_year ?? 9999);
      case "title-asc":
      default:
        return a.title.localeCompare(b.title, "fr");
    }
  });
}

function getVisiblePlatforms(platforms: PlatformRelation[]) {
  const sortedPlatforms = [...platforms].sort((a, b) => {
    const familyA = getPlatformFamily(a.name);
    const familyB = getPlatformFamily(b.name);

    if (familyA !== familyB) {
      return familyA.localeCompare(familyB, "fr");
    }

    return a.name.localeCompare(b.name, "fr");
  });

  return {
    shown: sortedPlatforms.slice(0, 3),
    remaining: Math.max(0, sortedPlatforms.length - 3),
  };
}

function getMissingBadges(game: Game) {
  const badges: string[] = [];

  if (!game.cover_url) badges.push("Sans jaquette");
  if (game.platforms.length === 0) badges.push("Sans plateforme");
  if (!game.description || game.description.trim().length === 0) {
    badges.push("Sans description");
  }

  return badges;
}

function ActiveFilterBadge({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-950/50 px-3 py-1.5 text-xs font-medium text-purple-100 hover:bg-purple-900/60"
    >
      <span>{label}</span>
      <span className="text-purple-300">×</span>
    </Link>
  );
}

export async function addGameToVault(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const gameId = Number(formData.get("game_id"));
  const platformId = Number(formData.get("platform_id"));
  const status = String(formData.get("status") ?? "wishlist");

  if (!Number.isFinite(gameId)) {
    throw new Error("Jeu invalide.");
  }

  if (!Number.isFinite(platformId)) {
    throw new Error("Plateforme invalide.");
  }

  if (!isCollectionStatus(status)) {
    throw new Error("Statut invalide.");
  }

  const { data: gamePlatform, error: gamePlatformError } = await supabase
    .from("game_platforms")
    .select("id")
    .eq("game_id", gameId)
    .eq("platform_id", platformId)
    .maybeSingle();

  if (gamePlatformError) {
    throw new Error(gamePlatformError.message);
  }

  if (!gamePlatform) {
    throw new Error("Cette plateforme n'est pas associée à ce jeu.");
  }

  const { data: platform, error: platformError } = await supabase
    .from("platforms")
    .select("id, name")
    .eq("id", platformId)
    .maybeSingle();

  if (platformError) {
    throw new Error(platformError.message);
  }

  if (!platform) {
    throw new Error("Plateforme introuvable.");
  }

  const defaults = getDefaultCollectionSettings(platform.name);

  const { error } = await supabase.from("user_collections").upsert(
    {
      user_id: user.id,
      game_id: gameId,
      platform_id: platformId,
      status,
      format: defaults.format,
      region: defaults.region,
    },
    {
      onConflict: "user_id,game_id,platform_id,region,format",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/games");
  revalidatePath("/collection");
}

export async function goToRandomGame(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const query = String(formData.get("q") ?? "");
  const activePlatform = String(formData.get("platform") ?? "all");
  const activeTag = String(formData.get("tag") ?? "all");
  const activeCollection = String(formData.get("collection") ?? "all");
  const activeSort = String(formData.get("sort") ?? "title-asc");
  const activeView = getViewMode(String(formData.get("view") ?? "cards"));
  const requestedQuality = getQualityFilter(
    String(formData.get("quality") ?? "all"),
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = Boolean(profile?.is_admin);
  }

  const activeQuality = isAdmin ? requestedQuality : "all";

  const { data } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      slug,
      description,
      series,
      release_year,
      cover_url,
      developer,
      publisher,
      game_tags (
        tags (
          id,
          name
        )
      )
    `,
    )
    .order("title", { ascending: true });

  const rawGames = (data ?? []) as unknown as RawGame[];
  const gameIds = rawGames.map((game) => game.id);

  const [platformsByGameId, collectionStatusByGameId] = await Promise.all([
    fetchPlatformsForGames({ supabase, gameIds }),
    fetchCollectionStatuses({
      supabase,
      userId: user?.id ?? null,
      gameIds,
    }),
  ]);

  const games = normalizeGames({
    rawGames,
    platformsByGameId,
    collectionStatusByGameId,
  });

  const filteredGames = sortGames(
    filterGames({
      games,
      query,
      activePlatform,
      activeTag,
      activeCollection,
      activeQuality,
    }),
    activeSort,
  );

  if (filteredGames.length === 0) {
    redirect(
      buildGamesUrl({
        q: query,
        platform: activePlatform,
        tag: activeTag,
        collection: activeCollection,
        sort: activeSort,
        view: activeView,
        quality: activeQuality,
        limit: ITEMS_PER_PAGE,
      }),
    );
  }

  const randomIndex = Math.floor(Math.random() * filteredGames.length);
  const randomGame = filteredGames[randomIndex];

  if (!randomGame) {
    redirect("/games");
  }

  redirect(`/games/${randomGame.slug}`);
}

function AdminEditButton({ gameId }: { gameId: number }) {
  return (
    <Link
      href={`/admin/games/${gameId}/edit`}
      className="block rounded border border-orange-500/70 bg-orange-950/40 px-3 py-2 text-center text-xs font-semibold text-orange-200 hover:bg-orange-900/50 hover:text-white"
    >
      Modifier
    </Link>
  );
}

export default async function GamesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const query = resolvedSearchParams.q ?? "";
  const activePlatform = resolvedSearchParams.platform ?? "all";
  const activeTag = resolvedSearchParams.tag ?? "all";
  const activeCollection = resolvedSearchParams.collection ?? "all";
  const activeSort = resolvedSearchParams.sort ?? "title-asc";
  const activeView = getViewMode(resolvedSearchParams.view);
  const requestedQuality = getQualityFilter(resolvedSearchParams.quality);
  const displayLimit = getDisplayLimit(resolvedSearchParams.limit);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = Boolean(profile?.is_admin);
  }

  const activeQuality = isAdmin ? requestedQuality : "all";

  const { data, error } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      slug,
      description,
      series,
      release_year,
      cover_url,
      developer,
      publisher,
      game_tags (
        tags (
          id,
          name
        )
      )
    `,
    )
    .order("title", { ascending: true });

  const rawGames = (data ?? []) as unknown as RawGame[];
  const gameIds = rawGames.map((game) => game.id);

  const [platformsByGameId, collectionStatusByGameId] = await Promise.all([
    fetchPlatformsForGames({ supabase, gameIds }),
    fetchCollectionStatuses({
      supabase,
      userId: user?.id ?? null,
      gameIds,
    }),
  ]);

  const games = normalizeGames({
    rawGames,
    platformsByGameId,
    collectionStatusByGameId,
  });

  const platformFilters = getPlatformFilters(games);
  const tagFilters = getTagFilters(games);

  const filteredGames = sortGames(
    filterGames({
      games,
      query,
      activePlatform,
      activeTag,
      activeCollection,
      activeQuality,
    }),
    activeSort,
  );

  const displayedGames = filteredGames.slice(0, displayLimit);
  const hasMoreGames = displayedGames.length < filteredGames.length;
  const nextLimit = Math.min(
    displayLimit + ITEMS_PER_PAGE,
    filteredGames.length,
  );

  const cardsUrl = buildGamesUrl({
    q: query,
    platform: activePlatform,
    tag: activeTag,
    collection: activeCollection,
    sort: activeSort,
    view: "cards",
    quality: activeQuality,
    limit: displayLimit,
  });

  const compactUrl = buildGamesUrl({
    q: query,
    platform: activePlatform,
    tag: activeTag,
    collection: activeCollection,
    sort: activeSort,
    view: "compact",
    quality: activeQuality,
    limit: displayLimit,
  });

  const loadMoreUrl = buildGamesUrl({
    q: query,
    platform: activePlatform,
    tag: activeTag,
    collection: activeCollection,
    sort: activeSort,
    view: activeView,
    quality: activeQuality,
    limit: nextLimit,
  });

  const activeFilterBadges = [
    ...(query.trim()
      ? [
          {
            label: `Recherche : ${query.trim()}`,
            href: buildGamesUrl({
              q: "",
              platform: activePlatform,
              tag: activeTag,
              collection: activeCollection,
              sort: activeSort,
              view: activeView,
              quality: activeQuality,
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
    ...(activePlatform !== "all"
      ? [
          {
            label: `Plateforme : ${getOptionLabel(
              platformFilters,
              activePlatform,
            )}`,
            href: buildGamesUrl({
              q: query,
              platform: "all",
              tag: activeTag,
              collection: activeCollection,
              sort: activeSort,
              view: activeView,
              quality: activeQuality,
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
    ...(activeTag !== "all"
      ? [
          {
            label: `Genre : ${getOptionLabel(tagFilters, activeTag)}`,
            href: buildGamesUrl({
              q: query,
              platform: activePlatform,
              tag: "all",
              collection: activeCollection,
              sort: activeSort,
              view: activeView,
              quality: activeQuality,
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
    ...(activeCollection !== "all"
      ? [
          {
            label: `Collection : ${getOptionLabel(
              collectionStatusOptions,
              activeCollection,
            )}`,
            href: buildGamesUrl({
              q: query,
              platform: activePlatform,
              tag: activeTag,
              collection: "all",
              sort: activeSort,
              view: activeView,
              quality: activeQuality,
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
    ...(isAdmin && activeQuality !== "all"
      ? [
          {
            label: `Qualité : ${getOptionLabel(
              qualityFilterOptions,
              activeQuality,
            )}`,
            href: buildGamesUrl({
              q: query,
              platform: activePlatform,
              tag: activeTag,
              collection: activeCollection,
              sort: activeSort,
              view: activeView,
              quality: "all",
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
    ...(activeSort !== "title-asc"
      ? [
          {
            label: `Tri : ${getOptionLabel(sortOptions, activeSort)}`,
            href: buildGamesUrl({
              q: query,
              platform: activePlatform,
              tag: activeTag,
              collection: activeCollection,
              sort: "title-asc",
              view: activeView,
              quality: activeQuality,
              limit: ITEMS_PER_PAGE,
            }),
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/30">
        <div className="mx-auto max-w-[1500px] px-8 py-6">
          <form
            action="/games"
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl"
          >
            <input type="hidden" name="view" value={activeView} />
            <input type="hidden" name="limit" value={ITEMS_PER_PAGE} />

            <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Catalogue JRPG
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredGames.length} jeu(x) trouvé(s) sur {games.length}
                  {filteredGames.length > 0 && (
                    <> · {displayedGames.length} affiché(s)</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={cardsUrl}
                  className={
                    activeView === "cards"
                      ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                      : "rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-purple-500"
                  }
                >
                  Cartes
                </Link>

                <Link
                  href={compactUrl}
                  className={
                    activeView === "compact"
                      ? "rounded border border-purple-500 bg-purple-600 px-3 py-2 text-sm font-medium text-white"
                      : "rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-purple-500"
                  }
                >
                  Compact
                </Link>

                {filteredGames.length > 0 && (
                  <button
                    type="submit"
                    formAction={goToRandomGame}
                    className="rounded border border-cyan-500/70 bg-cyan-950/50 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/60 hover:text-white"
                  >
                    Jeu aléatoire
                  </button>
                )}

                <Link
                  href="/games"
                  className="ml-2 text-sm text-purple-300 underline underline-offset-4 hover:text-purple-200"
                >
                  Réinitialiser
                </Link>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">
                Rechercher un JRPG
              </span>

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Final Fantasy, Xenoblade, PlayStation, rétro..."
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-purple-500"
              />
            </label>

            <div
              className={
                isAdmin
                  ? "mt-4 grid gap-4 lg:grid-cols-4"
                  : "mt-4 grid gap-4 lg:grid-cols-3"
              }
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">
                  Plateforme
                </span>

                <select
                  name="platform"
                  defaultValue={activePlatform}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
                >
                  {platformFilters.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">Genre</span>

                <select
                  name="tag"
                  defaultValue={activeTag}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
                >
                  <option value="all">Tous les genres</option>

                  {tagFilters.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-white">
                  Statut collection
                </span>

                <select
                  name="collection"
                  defaultValue={activeCollection}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-purple-500"
                >
                  {collectionStatusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              {isAdmin && (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-orange-200">
                    Qualité fiche
                  </span>

                  <select
                    name="quality"
                    defaultValue={activeQuality}
                    className="rounded-lg border border-orange-900/70 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-orange-500"
                  >
                    {qualityFilterOptions.map((quality) => (
                      <option key={quality.value} value={quality.value}>
                        {quality.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {activeFilterBadges.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Filtres actifs
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {activeFilterBadges.map((badge) => (
                      <ActiveFilterBadge
                        key={badge.label}
                        label={badge.label}
                        href={badge.href}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-800 pt-5 md:flex-row md:items-end md:justify-between">
              <button
                type="submit"
                className="rounded bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-500"
              >
                Filtrer
              </button>

              <label className="flex items-center gap-3">
                <span className="text-sm text-slate-400">Tri</span>

                <select
                  name="sort"
                  defaultValue={activeSort}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-purple-500"
                >
                  {sortOptions.map((sort) => (
                    <option key={sort.value} value={sort.value}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-8 py-6">
        {error && (
          <div className="mb-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-200">
            Erreur pendant le chargement du catalogue : {error.message}
          </div>
        )}

        {filteredGames.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
            <h2 className="text-2xl font-bold text-white">Aucun jeu trouvé</h2>

            <p className="mt-3 text-slate-400">
              Aucun JRPG ne correspond aux filtres sélectionnés.
            </p>

            <Link
              href="/games"
              className="mt-6 inline-block rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
            >
              Réinitialiser les filtres
            </Link>
          </div>
        ) : activeView === "compact" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
            <div className="grid grid-cols-[64px_1fr] gap-3 border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[72px_1.5fr_1.4fr_80px_130px_220px]">
              <span>Cover</span>
              <span>Jeu</span>
              <span className="hidden md:block">Plateformes</span>
              <span className="hidden md:block">Année</span>
              <span className="hidden md:block">Statut</span>
              <span className="hidden md:block">Action</span>
            </div>

            <div className="divide-y divide-slate-800">
              {displayedGames.map((game) => {
                const visiblePlatforms = getVisiblePlatforms(game.platforms);
                const missingBadges = isAdmin ? getMissingBadges(game) : [];

                return (
                  <article
                    key={game.id}
                    className="grid grid-cols-[64px_1fr] gap-3 px-4 py-3 hover:bg-slate-900 md:grid-cols-[72px_1.5fr_1.4fr_80px_130px_220px] md:items-center"
                  >
                    <Link
                      href={`/games/${game.slug}`}
                      className="block overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
                    >
                      <div className="aspect-[3/4]">
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt={`Jaquette de ${game.title}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-purple-300">
                            JRPG
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <Link href={`/games/${game.slug}`}>
                        <h2 className="line-clamp-2 font-bold leading-snug text-white hover:text-purple-300">
                          {game.title}
                        </h2>
                      </Link>

                      {missingBadges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {missingBadges.map((badge) => (
                            <span
                              key={badge}
                              className="rounded border border-orange-900/70 bg-orange-950/50 px-2 py-0.5 text-[11px] text-orange-200"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {game.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {game.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-300"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden flex-wrap gap-1.5 md:flex">
                      {visiblePlatforms.shown.length > 0 ? (
                        visiblePlatforms.shown.map((platform) => (
                          <Link
                            key={platform.id}
                            href={buildGamesUrl({
                              q: query,
                              platform: platform.id.toString(),
                              tag: activeTag,
                              collection: activeCollection,
                              sort: activeSort,
                              view: activeView,
                              quality: activeQuality,
                              limit: displayLimit,
                            })}
                            title={`Filtrer le catalogue sur ${platform.name}`}
                            className={`rounded border px-2 py-1 text-[11px] font-medium transition hover:brightness-110 ${getPlatformTagClass(
                              platform.name,
                            )}`}
                          >
                            {platform.name}
                          </Link>
                        ))
                      ) : (
                        <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                          Inconnue
                        </span>
                      )}

                      {visiblePlatforms.remaining > 0 && (
                        <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-300">
                          +{visiblePlatforms.remaining}
                        </span>
                      )}
                    </div>

                    <div className="hidden text-sm text-slate-300 md:block">
                      {game.release_year ?? "—"}
                    </div>

                    <div className="hidden md:block">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCollectionStatusClass(
                          game.collection_status,
                        )}`}
                      >
                        {getCollectionStatusLabel(game.collection_status)}
                      </span>
                    </div>

                    <div className="col-span-2 mt-2 grid gap-2 md:col-span-1 md:mt-0">
                      {isAdmin && <AdminEditButton gameId={game.id} />}

                      {!user ? (
                        <Link
                          href="/auth/login"
                          className="block rounded border border-purple-500 px-3 py-2 text-center text-xs font-medium text-purple-200 hover:bg-purple-950"
                        >
                          Connexion
                        </Link>
                      ) : game.collection_status ? (
                        <Link
                          href="/collection"
                          className="block rounded border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-300 hover:border-purple-500 hover:text-white"
                        >
                          Dans le Vault
                        </Link>
                      ) : game.platforms.length === 0 ? (
                        <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                          À compléter
                        </div>
                      ) : (
                        <form action={addGameToVault} className="grid gap-2">
                          <input type="hidden" name="game_id" value={game.id} />

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              name="status"
                              defaultValue="wishlist"
                              className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                            >
                              {addStatusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            <select
                              name="platform_id"
                              defaultValue={game.platforms[0]?.id}
                              className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                            >
                              {game.platforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                  {platform.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="rounded bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                          >
                            + Ajouter
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {displayedGames.map((game) => {
              const visiblePlatforms = getVisiblePlatforms(game.platforms);
              const missingBadges = isAdmin ? getMissingBadges(game) : [];

              return (
                <article
                  key={game.id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg transition hover:border-purple-500 hover:bg-slate-900"
                >
                  <div className="relative aspect-[3/4] bg-slate-950">
                    <Link
                      href={`/games/${game.slug}`}
                      className="block h-full w-full group"
                    >
                      {game.cover_url ? (
                        <img
                          src={game.cover_url}
                          alt={`Jaquette de ${game.title}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-5 text-center text-lg font-bold text-purple-300">
                          {game.title}
                        </div>
                      )}
                    </Link>

                    <div className="absolute left-2 top-2 flex max-w-[90%] flex-wrap gap-1.5">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCollectionStatusClass(
                          game.collection_status,
                        )}`}
                      >
                        {getCollectionStatusLabel(game.collection_status)}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="absolute right-2 top-2">
                        <Link
                          href={`/admin/games/${game.id}/edit`}
                          className="rounded border border-orange-500/70 bg-orange-950/90 px-2.5 py-1 text-[11px] font-semibold text-orange-200 hover:bg-orange-900 hover:text-white"
                        >
                          Modifier
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <Link href={`/games/${game.slug}`} className="group">
                      <h2 className="line-clamp-2 text-base font-bold leading-snug text-white group-hover:text-purple-300">
                        {game.title}
                      </h2>
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {visiblePlatforms.shown.length > 0 ? (
                        visiblePlatforms.shown.map((platform) => (
                          <Link
                            key={platform.id}
                            href={buildGamesUrl({
                              q: query,
                              platform: platform.id.toString(),
                              tag: activeTag,
                              collection: activeCollection,
                              sort: activeSort,
                              view: activeView,
                              quality: activeQuality,
                              limit: displayLimit,
                            })}
                            title={`Filtrer le catalogue sur ${platform.name}`}
                            className={`rounded border px-2 py-1 text-[11px] font-medium transition hover:brightness-110 ${getPlatformTagClass(
                              platform.name,
                            )}`}
                          >
                            {platform.name}
                          </Link>
                        ))
                      ) : (
                        <span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300">
                          Plateforme inconnue
                        </span>
                      )}

                      {game.release_year && (
                        <span className="rounded border border-purple-500/40 bg-purple-950/70 px-2 py-1 text-[11px] font-medium text-purple-200">
                          {game.release_year}
                        </span>
                      )}

                      {visiblePlatforms.remaining > 0 && (
                        <span className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] font-medium text-slate-300">
                          +{visiblePlatforms.remaining}
                        </span>
                      )}
                    </div>

                    {missingBadges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {missingBadges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded border border-orange-900/70 bg-orange-950/50 px-2 py-0.5 text-[11px] text-orange-200"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {game.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {game.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 grid gap-2 border-t border-slate-800 pt-3">
                      {isAdmin && <AdminEditButton gameId={game.id} />}

                      {!user ? (
                        <Link
                          href="/auth/login"
                          className="block rounded border border-purple-500 px-3 py-2 text-center text-xs font-medium text-purple-200 hover:bg-purple-950"
                        >
                          Connexion pour ajouter
                        </Link>
                      ) : game.collection_status ? (
                        <Link
                          href="/collection"
                          className="block rounded border border-slate-700 px-3 py-2 text-center text-xs font-medium text-slate-300 hover:border-purple-500 hover:text-white"
                        >
                          Déjà dans le Vault
                        </Link>
                      ) : game.platforms.length === 0 ? (
                        <div className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-center text-xs text-slate-500">
                          Fiche à compléter
                        </div>
                      ) : (
                        <form action={addGameToVault} className="grid gap-2">
                          <input type="hidden" name="game_id" value={game.id} />

                          <div className="grid grid-cols-2 gap-2">
                            <select
                              name="status"
                              defaultValue="wishlist"
                              className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                            >
                              {addStatusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            <select
                              name="platform_id"
                              defaultValue={game.platforms[0]?.id}
                              className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-purple-500"
                            >
                              {game.platforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                  {platform.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="rounded bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                          >
                            + Ajouter au Vault
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {hasMoreGames && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400">
              {displayedGames.length} jeu(x) affiché(s) sur{" "}
              {filteredGames.length}
            </p>

            <Link
              href={loadMoreUrl}
              scroll={false}
              className="rounded border border-purple-500 bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              Charger{" "}
              {Math.min(
                ITEMS_PER_PAGE,
                filteredGames.length - displayedGames.length,
              )}{" "}
              jeux de plus
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
