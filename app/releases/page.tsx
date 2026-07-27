import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  q?: string | string[];
  platform?: string | string[];
  month?: string | string[];
  region?: string | string[];
  format?: string | string[];
  followed?: string | string[];
  view?: string | string[];
};

type ViewMode = "cards" | "compact";

type Platform = {
  id: number;
  name: string;
  manufacturer: string | null;
  slug: string | null;
  is_legacy: boolean | null;
};

type GameSummary = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  series: string | null;
};

type ReleaseRow = {
  id: number;
  game_id: number;
  platform_id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  card_image_url: string | null;
  games: GameSummary | GameSummary[] | null;
  platforms: Platform | Platform[] | null;
};

type NormalizedRelease = {
  id: number;
  region: string | null;
  release_date: string | null;
  physical: boolean | null;
  digital: boolean | null;
  status: string | null;
  edition_name: string | null;
  card_image_url: string | null;
  game: GameSummary;
  platform: Platform;
};

type ReleaseCard = {
  key: string;
  primary_release_id: number;
  title: string;
  slug: string;
  series: string | null;
  release_date: string | null;
  edition_name: string | null;
  image_url: string | null;
  platforms: Platform[];
  rows: NormalizedRelease[];
  is_followed: boolean;
};

type FilterState = {
  q: string;
  platform: string;
  month: string;
  region: string;
  format: string;
  followed: boolean;
  view: ViewMode;
};

const platformFilters = [
  { label: "Tous", value: "all" },
  { label: "PS5", value: "ps5" },
  { label: "PS4", value: "ps4" },
  { label: "Switch", value: "switch" },
  { label: "Switch 2", value: "switch-2" },
  { label: "Xbox Series S/X", value: "xbox-series" },
  { label: "PC", value: "pc" },
];

const regionFilters = [
  { label: "Toutes régions", value: "all" },
  { label: "PAL", value: "PAL" },
  { label: "US", value: "US" },
  { label: "JAP", value: "JAP" },
  { label: "ASIA", value: "ASIA" },
  { label: "WORLD", value: "WORLD" },
];

const formatFilters = [
  { label: "Tous formats", value: "all" },
  { label: "Physique", value: "physical" },
  { label: "Numérique", value: "digital" },
  { label: "Physique + numérique", value: "both" },
];

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getViewMode(value: string | string[] | undefined): ViewMode {
  return getStringParam(value) === "compact" ? "compact" : "cards";
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(localDate);
}

function formatMonth(date: string | null) {
  if (!date) {
    return "Date inconnue";
  }

  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(localDate);
}

function formatEdition(editionName: string | null) {
  return editionName?.trim() ? editionName.trim() : null;
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

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizePlatformName(name: string | null | undefined) {
  return normalizeText(name);
}

function getFilterLabel(
  filters: { label: string; value: string }[],
  value: string,
) {
  return filters.find((filter) => filter.value === value)?.label ?? value;
}

function isNintendoPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);

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

function isPlayStationPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);

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

function isXboxPlatform(platform: Platform) {
  return normalizePlatformName(platform.name).includes("xbox");
}

function isPcPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "pc" ||
    normalizedSlug.includes("windows") ||
    normalizedSlug.includes("steam") ||
    normalizedName === "pc" ||
    normalizedName.includes("windows") ||
    normalizedName.includes("steam")
  );
}

function isPS5Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "ps5" ||
    normalizedSlug === "playstation-5" ||
    normalizedName === "ps5" ||
    normalizedName.includes("playstation 5")
  );
}

function isPS4Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "ps4" ||
    normalizedSlug === "playstation-4" ||
    normalizedName === "ps4" ||
    normalizedName.includes("playstation 4")
  );
}

function isSwitch2Platform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug === "switch-2" ||
    normalizedSlug === "nintendo-switch-2" ||
    normalizedName === "switch 2" ||
    normalizedName.includes("nintendo switch 2")
  );
}

function isSwitchPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    !isSwitch2Platform(platform) &&
    (normalizedSlug === "switch" ||
      normalizedSlug === "nintendo-switch" ||
      normalizedName === "switch" ||
      normalizedName.includes("nintendo switch"))
  );
}

function isXboxSeriesPlatform(platform: Platform) {
  const normalizedName = normalizePlatformName(platform.name);
  const normalizedSlug = normalizePlatformName(platform.slug);

  return (
    normalizedSlug.includes("xbox-series") ||
    normalizedName.includes("xbox series")
  );
}

function matchesPlatformFilter(platform: Platform, filter: string) {
  switch (filter) {
    case "ps5":
      return isPS5Platform(platform);
    case "ps4":
      return isPS4Platform(platform);
    case "switch":
      return isSwitchPlatform(platform);
    case "switch-2":
      return isSwitch2Platform(platform);
    case "xbox-series":
      return isXboxSeriesPlatform(platform);
    case "pc":
      return isPcPlatform(platform);
    default:
      return true;
  }
}

function matchesFormatFilter(release: NormalizedRelease, filter: string) {
  switch (filter) {
    case "physical":
      return Boolean(release.physical);
    case "digital":
      return Boolean(release.digital);
    case "both":
      return Boolean(release.physical && release.digital);
    default:
      return true;
  }
}

function getPlatformTagClass(platform: Platform) {
  if (isSwitchPlatform(platform) || isSwitch2Platform(platform)) {
    return "border-red-500 bg-red-600 text-white";
  }

  if (isPS5Platform(platform) || isPS4Platform(platform)) {
    return "border-sky-500 bg-sky-600 text-white";
  }

  if (isXboxSeriesPlatform(platform) || isXboxPlatform(platform)) {
    return "border-green-500 bg-green-600 text-white";
  }

  if (isPcPlatform(platform)) {
    return "border-purple-500 bg-purple-600 text-white";
  }

  if (isNintendoPlatform(platform)) {
    return "border-red-500 bg-red-600 text-white";
  }

  if (isPlayStationPlatform(platform)) {
    return "border-sky-500 bg-sky-600 text-white";
  }

  return "border-slate-600 bg-slate-800 text-slate-200";
}

function getFilterHref(filters: FilterState) {
  const params = new URLSearchParams();

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.platform !== "all") {
    params.set("platform", filters.platform);
  }

  if (filters.month !== "all") {
    params.set("month", filters.month);
  }

  if (filters.region !== "all") {
    params.set("region", filters.region);
  }

  if (filters.format !== "all") {
    params.set("format", filters.format);
  }

  if (filters.followed) {
    params.set("followed", "1");
  }

  if (filters.view !== "cards") {
    params.set("view", filters.view);
  }

  const query = params.toString();

  return query ? `/releases?${query}` : "/releases";
}

function getFilterButtonClass(active: boolean) {
  return active
    ? "rounded border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-medium text-white"
    : "rounded border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-300 hover:border-purple-500 hover:text-white";
}

function getViewButtonClass(active: boolean) {
  return active
    ? "rounded-xl border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
    : "rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 hover:border-purple-500 hover:text-white";
}

function getUniqueReleaseMonths(releases: NormalizedRelease[]) {
  const months = new Set<string>();

  for (const release of releases) {
    if (release.release_date) {
      months.add(release.release_date.slice(0, 7));
    }
  }

  return Array.from(months)
    .sort()
    .map((monthValue) => {
      const [year, month] = monthValue.split("-").map(Number);
      const localDate = new Date(year, month - 1, 1);

      return {
        value: monthValue,
        label: new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric",
        }).format(localDate),
      };
    });
}

function getUniqueRegions(releases: NormalizedRelease[]) {
  const regions = new Set<string>();

  for (const release of releases) {
    if (release.region?.trim()) {
      regions.add(release.region.trim());
    }
  }

  return Array.from(regions).sort((a, b) => a.localeCompare(b, "fr"));
}

function getCardRegions(card: ReleaseCard) {
  const regions = Array.from(
    new Set(
      card.rows
        .map((row) => row.region)
        .filter((region): region is string => Boolean(region?.trim())),
    ),
  );

  return regions.length > 0 ? regions.join(" · ") : "Région inconnue";
}

function getCardFormats(card: ReleaseCard) {
  const formats = Array.from(
    new Set(
      card.rows.map((row) => formatReleaseFormat(row.physical, row.digital)),
    ),
  );

  return formats.length > 0 ? formats.join(" · ") : "Format inconnu";
}

function getAdminReleaseEditHref(releaseId: number) {
  return `/admin/releases/${releaseId}/edit`;
}

function groupReleases(
  releases: NormalizedRelease[],
  followedGameIds: Set<number>,
) {
  const cardsByKey = new Map<string, ReleaseCard>();

  for (const release of releases) {
    const editionKey = release.edition_name?.trim() || "standard";
    const dateKey = release.release_date ?? "unknown";
    const key = `${release.game.id}-${dateKey}-${editionKey}`;

    const existingCard = cardsByKey.get(key);

    if (!existingCard) {
      cardsByKey.set(key, {
        key,
        primary_release_id: release.id,
        title: release.game.title,
        slug: release.game.slug,
        series: release.game.series,
        release_date: release.release_date,
        edition_name: release.edition_name,
        image_url: release.card_image_url ?? release.game.cover_url,
        platforms: [release.platform],
        rows: [release],
        is_followed: followedGameIds.has(release.game.id),
      });

      continue;
    }

    if (!existingCard.image_url) {
      existingCard.image_url = release.card_image_url ?? release.game.cover_url;
    }

    if (
      !existingCard.platforms.some(
        (platform) => platform.id === release.platform.id,
      )
    ) {
      existingCard.platforms.push(release.platform);
    }

    existingCard.rows.push(release);
  }

  return Array.from(cardsByKey.values()).sort((a, b) => {
    const dateCompare = (a.release_date ?? "9999-12-31").localeCompare(
      b.release_date ?? "9999-12-31",
    );

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.title.localeCompare(b.title, "fr");
  });
}

function groupCardsByMonth(cards: ReleaseCard[]) {
  const groups = new Map<string, ReleaseCard[]>();

  for (const card of cards) {
    const month = formatMonth(card.release_date);
    const currentCards = groups.get(month) ?? [];

    currentCards.push(card);
    groups.set(month, currentCards);
  }

  return Array.from(groups.entries());
}

function ReleaseCardView({
  card,
  isAdmin,
}: {
  card: ReleaseCard;
  isAdmin: boolean;
}) {
  const edition = formatEdition(card.edition_name);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition hover:-translate-y-1 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-950/30">
      <Link href={`/games/${card.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={`Image de sortie de ${card.title}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_16rem)] px-6 text-center text-sm font-semibold text-purple-200">
              JRPG Vault
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

          {card.is_followed && (
            <div className="absolute right-3 top-3 rounded-full border border-purple-400 bg-purple-950/90 px-3 py-1 text-xs font-semibold text-purple-100">
              ★ Suivi
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/games/${card.slug}`} className="block">
          <h3 className="line-clamp-2 text-lg font-bold text-white group-hover:text-purple-200">
            {card.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-slate-400">
          Sortie :{" "}
          <span className="font-medium text-slate-200">
            {formatDate(card.release_date)}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {card.platforms.map((platform) => (
            <span
              key={platform.id}
              className={`rounded px-2.5 py-1 text-xs font-semibold ${getPlatformTagClass(
                platform,
              )}`}
            >
              {platform.name}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-1 text-xs text-slate-500">
          {edition && <p>{edition}</p>}
          <p>
            {getCardRegions(card)} · {getCardFormats(card)}
          </p>
        </div>

        {isAdmin && (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <Link
              href={getAdminReleaseEditHref(card.primary_release_id)}
              className="inline-flex w-full items-center justify-center rounded-xl border border-purple-500/60 bg-purple-950/40 px-3 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-900/70 hover:text-white"
            >
              Modifier
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function ReleaseCompactRow({
  card,
  isAdmin,
}: {
  card: ReleaseCard;
  isAdmin: boolean;
}) {
  const edition = formatEdition(card.edition_name);
  const rowClassName = isAdmin
    ? "grid gap-3 border-b border-slate-800 px-4 py-4 transition hover:bg-slate-900/80 md:grid-cols-[120px_1.5fr_1.2fr_0.8fr_1fr_1fr_90px] md:items-center"
    : "grid gap-3 border-b border-slate-800 px-4 py-4 transition hover:bg-slate-900/80 md:grid-cols-[120px_1.5fr_1.2fr_0.8fr_1fr_1fr] md:items-center";

  return (
    <div className={rowClassName}>
      <div className="text-sm font-semibold text-slate-200">
        {formatDate(card.release_date)}
      </div>

      <Link
        href={`/games/${card.slug}`}
        className="flex min-w-0 items-center gap-3"
      >
        <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-800">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={`Image de sortie de ${card.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-purple-300">
              JRPG
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-1 font-semibold text-white hover:text-purple-200">
            {card.title}
          </h3>

          <div className="mt-1 flex flex-wrap gap-2">
            {card.series && (
              <span className="text-xs text-slate-500">{card.series}</span>
            )}

            {card.is_followed && (
              <span className="rounded-full border border-purple-500/40 bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-200">
                ★ Suivi
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-wrap gap-2">
        {card.platforms.map((platform) => (
          <span
            key={platform.id}
            className={`rounded px-2 py-1 text-xs font-semibold ${getPlatformTagClass(
              platform,
            )}`}
          >
            {platform.name}
          </span>
        ))}
      </div>

      <div className="text-sm text-slate-400">{getCardRegions(card)}</div>

      <div className="text-sm text-slate-400">{getCardFormats(card)}</div>

      <div className="text-sm text-slate-400">{edition ?? "—"}</div>

      {isAdmin && (
        <Link
          href={getAdminReleaseEditHref(card.primary_release_id)}
          className="inline-flex justify-center rounded-lg border border-purple-500/60 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-100 hover:bg-purple-900/70 hover:text-white"
        >
          Modifier
        </Link>
      )}
    </div>
  );
}

function ReleaseCompactTable({
  cards,
  isAdmin,
}: {
  cards: ReleaseCard[];
  isAdmin: boolean;
}) {
  const headerClassName = isAdmin
    ? "hidden border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[120px_1.5fr_1.2fr_0.8fr_1fr_1fr_90px]"
    : "hidden border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[120px_1.5fr_1.2fr_0.8fr_1fr_1fr]";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
      <div className={headerClassName}>
        <span>Date</span>
        <span>Jeu</span>
        <span>Plateformes</span>
        <span>Région</span>
        <span>Format</span>
        <span>Édition</span>
        {isAdmin && <span>Admin</span>}
      </div>

      <div>
        {cards.map((card) => (
          <ReleaseCompactRow key={card.key} card={card} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

export default async function ReleasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const selectedPlatform =
    getStringParam(resolvedSearchParams.platform) ?? "all";
  const selectedPlatformIsValid = platformFilters.some(
    (filter) => filter.value === selectedPlatform,
  );

  const q = getStringParam(resolvedSearchParams.q)?.trim() ?? "";
  const activePlatform = selectedPlatformIsValid ? selectedPlatform : "all";
  const activeMonth = getStringParam(resolvedSearchParams.month) ?? "all";
  const activeRegion = getStringParam(resolvedSearchParams.region) ?? "all";
  const activeFormat = getStringParam(resolvedSearchParams.format) ?? "all";
  const activeView = getViewMode(resolvedSearchParams.view);
  const showFollowedOnly = getStringParam(resolvedSearchParams.followed) === "1";

  const activeFilters: FilterState = {
    q,
    platform: activePlatform,
    month: activeMonth,
    region: activeRegion,
    format: activeFormat,
    followed: showFollowedOnly,
    view: activeView,
  };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let followedGameIds = new Set<number>();

  if (user) {
    const [{ data: profile }, { data: followedGames }] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_followed_games")
        .select("game_id")
        .eq("user_id", user.id),
    ]);

    isAdmin = Boolean(profile?.is_admin);

    followedGameIds = new Set(
      (followedGames ?? [])
        .map((item) => Number(item.game_id))
        .filter((id) => Number.isFinite(id)),
    );
  }

  const { data, error } = await supabase
    .from("game_releases")
    .select(
      `
      id,
      game_id,
      platform_id,
      region,
      release_date,
      physical,
      digital,
      status,
      edition_name,
      card_image_url,
      games (
        id,
        title,
        slug,
        cover_url,
        series
      ),
      platforms (
        id,
        name,
        manufacturer,
        slug,
        is_legacy
      )
    `,
    )
    .not("release_date", "is", null)
    .gte("release_date", getTodayDate())
    .or("status.is.null,status.neq.released")
    .order("release_date", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 lg:px-8">
        <section className="mx-auto max-w-[1500px] rounded-2xl border border-red-500/40 bg-red-950/30 p-6">
          <h1 className="text-2xl font-bold text-white">
            Erreur de chargement des sorties
          </h1>

          <p className="mt-3 text-sm text-red-200">{error.message}</p>

          <p className="mt-4 text-sm text-slate-300">
            Vérifie que la colonne{" "}
            <code className="rounded bg-slate-950 px-1.5 py-0.5">
              card_image_url
            </code>{" "}
            existe bien dans{" "}
            <code className="rounded bg-slate-950 px-1.5 py-0.5">
              game_releases
            </code>
            .
          </p>
        </section>
      </main>
    );
  }

  const normalizedReleases = ((data ?? []) as unknown as ReleaseRow[])
    .map((release) => ({
      id: release.id,
      region: release.region,
      release_date: release.release_date,
      physical: release.physical,
      digital: release.digital,
      status: release.status,
      edition_name: release.edition_name,
      card_image_url: release.card_image_url,
      game: normalizeRelation(release.games),
      platform: normalizeRelation(release.platforms),
    }))
    .filter(
      (release): release is NormalizedRelease =>
        release.game !== null && release.platform !== null,
    );

  const availableMonths = getUniqueReleaseMonths(normalizedReleases);
  const availableRegions = getUniqueRegions(normalizedReleases);

  const filteredReleases = normalizedReleases.filter((release) => {
    const normalizedSearch = normalizeText(q);
    const matchesSearch =
      !normalizedSearch ||
      normalizeText(release.game.title).includes(normalizedSearch) ||
      normalizeText(release.game.series).includes(normalizedSearch);

    const matchesPlatform = matchesPlatformFilter(
      release.platform,
      activePlatform,
    );

    const matchesMonth =
      activeMonth === "all" ||
      release.release_date?.startsWith(activeMonth) === true;

    const matchesRegion =
      activeRegion === "all" || release.region === activeRegion;

    const matchesFormat = matchesFormatFilter(release, activeFormat);

    const matchesFollowed =
      !showFollowedOnly || followedGameIds.has(release.game.id);

    return (
      matchesSearch &&
      matchesPlatform &&
      matchesMonth &&
      matchesRegion &&
      matchesFormat &&
      matchesFollowed
    );
  });

  const releaseCards = groupReleases(filteredReleases, followedGameIds);
  const groupedCards = groupCardsByMonth(releaseCards);

  const activeMonthLabel =
    availableMonths.find((month) => month.value === activeMonth)?.label ??
    activeMonth;

  const activeFilterBadges = [
    q
      ? {
          label: `Recherche : ${q}`,
          href: getFilterHref({ ...activeFilters, q: "" }),
        }
      : null,
    activePlatform !== "all"
      ? {
          label: `Plateforme : ${getFilterLabel(
            platformFilters,
            activePlatform,
          )}`,
          href: getFilterHref({ ...activeFilters, platform: "all" }),
        }
      : null,
    activeMonth !== "all"
      ? {
          label: `Mois : ${activeMonthLabel}`,
          href: getFilterHref({ ...activeFilters, month: "all" }),
        }
      : null,
    activeRegion !== "all"
      ? {
          label: `Région : ${activeRegion}`,
          href: getFilterHref({ ...activeFilters, region: "all" }),
        }
      : null,
    activeFormat !== "all"
      ? {
          label: `Format : ${getFilterLabel(formatFilters, activeFormat)}`,
          href: getFilterHref({ ...activeFilters, format: "all" }),
        }
      : null,
    showFollowedOnly
      ? {
          label: "Mes jeux suivis",
          href: getFilterHref({ ...activeFilters, followed: false }),
        }
      : null,
  ].filter((badge): badge is { label: string; href: string } =>
    Boolean(badge),
  );

  const hasActiveFilters = activeFilterBadges.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_30rem),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_28rem)]">
        <div className="mx-auto max-w-[1500px] px-6 py-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-400">
                  Calendrier
                </p>

                <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white lg:text-4xl">
                    Sorties à venir
                  </h1>

                  <span className="pb-1 text-sm text-slate-400">
                    {releaseCards.length} sortie
                    {releaseCards.length > 1 ? "s" : ""} affichée
                    {releaseCards.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {platformFilters.map((filter) => (
                  <Link
                    key={filter.value}
                    href={getFilterHref({
                      ...activeFilters,
                      platform: filter.value,
                    })}
                    className={getFilterButtonClass(
                      activePlatform === filter.value,
                    )}
                  >
                    {filter.label}
                  </Link>
                ))}

                <Link
                  href={
                    user
                      ? getFilterHref({
                          ...activeFilters,
                          followed: !showFollowedOnly,
                        })
                      : "/auth/login"
                  }
                  className={
                    showFollowedOnly
                      ? "rounded border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-medium text-white"
                      : "rounded border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-300 hover:border-purple-500 hover:text-white"
                  }
                >
                  ★ Mes jeux suivis
                </Link>

                <Link
                  href="/games"
                  className="rounded border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-300 hover:border-purple-500 hover:text-white"
                >
                  Catalogue
                </Link>
              </div>
            </div>

            <form
              action="/releases"
              className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]"
            >
              <input type="hidden" name="platform" value={activePlatform} />
              <input type="hidden" name="view" value={activeView} />
              {showFollowedOnly && (
                <input type="hidden" name="followed" value="1" />
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recherche
                </span>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Rechercher un jeu..."
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-purple-500"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mois
                </span>
                <select
                  name="month"
                  defaultValue={activeMonth}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-purple-500"
                >
                  <option value="all">Tous les mois</option>
                  {availableMonths.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Région
                </span>
                <select
                  name="region"
                  defaultValue={activeRegion}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-purple-500"
                >
                  <option value="all">Toutes régions</option>
                  {availableRegions.length > 0
                    ? availableRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))
                    : regionFilters
                        .filter((region) => region.value !== "all")
                        .map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Format
                </span>
                <select
                  name="format"
                  defaultValue={activeFormat}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-purple-500"
                >
                  {formatFilters.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
                >
                  Filtrer
                </button>

                {hasActiveFilters && (
                  <Link
                    href={
                      activeView === "compact"
                        ? "/releases?view=compact"
                        : "/releases"
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-300 hover:border-purple-500 hover:text-white"
                  >
                    Reset
                  </Link>
                )}
              </div>
            </form>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-800 pt-4 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                {hasActiveFilters ? (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Filtres actifs
                    </span>

                    {activeFilterBadges.map((badge) => (
                      <Link
                        key={badge.label}
                        href={badge.href}
                        className="rounded-full border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-medium text-purple-200 hover:bg-purple-900/60 hover:text-white"
                      >
                        {badge.label} ×
                      </Link>
                    ))}

                    <Link
                      href={
                        activeView === "compact"
                          ? "/releases?view=compact"
                          : "/releases"
                      }
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-purple-500 hover:text-white"
                    >
                      Tout effacer
                    </Link>
                  </>
                ) : (
                  <span className="text-sm text-slate-500">
                    Aucun filtre actif.
                  </span>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={getFilterHref({ ...activeFilters, view: "cards" })}
                  className={getViewButtonClass(activeView === "cards")}
                >
                  Cartes
                </Link>

                <Link
                  href={getFilterHref({ ...activeFilters, view: "compact" })}
                  className={getViewButtonClass(activeView === "compact")}
                >
                  Compact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-6 py-10 lg:px-8">
        {releaseCards.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white">
              Aucune sortie trouvée
            </h2>

            <p className="mt-3 text-slate-400">
              Essaie un autre filtre ou ajoute des sorties dans l’admin.
            </p>

            <Link
              href={
                activeView === "compact" ? "/releases?view=compact" : "/releases"
              }
              className="mt-6 inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500"
            >
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="grid gap-10">
            {groupedCards.map(([month, cards]) => (
              <section key={month}>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <h2 className="text-2xl font-bold capitalize text-white">
                      {month}
                    </h2>

                    <span className="pb-0.5 text-sm text-slate-500">
                      {cards.length} sortie{cards.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="h-px flex-1 bg-slate-800" />
                </div>

                {activeView === "compact" ? (
                  <ReleaseCompactTable cards={cards} isAdmin={isAdmin} />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cards.map((card) => (
                      <ReleaseCardView
                        key={card.key}
                        card={card}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
