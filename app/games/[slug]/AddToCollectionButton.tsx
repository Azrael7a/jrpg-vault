"use client";

import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type Region = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";

type PlatformRelation = {
  id: number;
  name: string;
  is_legacy: boolean;
  display_order: number;
};

type RawGamePlatform = {
  platform_id: number;
  region: Region;
  physical: boolean | null;
  digital: boolean | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type RawCollectionEntry = {
  id: number;
  platform_id: number | null;
  status: string | null;
  format: string | null;
  region: Region | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type AvailableVersion = {
  platform: PlatformRelation;
  region: Region;
  physical: boolean;
  digital: boolean;
};

type CollectionEntry = {
  id: number;
  platform: PlatformRelation | null;
  status: string | null;
  format: string | null;
  region: Region | null;
};

type Props = {
  gameId: number;
  preferredPlatformId?: number | null;
  preferredRegion?: Region | null;
};

const statuses = [
  { value: "owned", label: "Possédé" },
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "wishlist", label: "Wishlist" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
] as const;

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function comparePlatforms(a: PlatformRelation, b: PlatformRelation) {
  if (a.is_legacy !== b.is_legacy) {
    return Number(a.is_legacy) - Number(b.is_legacy);
  }

  return (
    a.display_order - b.display_order ||
    a.name.localeCompare(b.name, "fr")
  );
}

function getInitialFormat(version: AvailableVersion) {
  if (version.physical) {
    return "physical";
  }

  if (version.digital) {
    return "digital";
  }

  return "physical";
}

function getStatusLabel(value: string | null) {
  return statuses.find((status) => status.value === value)?.label ?? "Collection";
}

function getFormatLabel(value: string | null) {
  switch (value) {
    case "physical":
      return "Physique";
    case "digital":
      return "Numérique";
    case "both":
      return "Physique + numérique";
    default:
      return null;
  }
}

export default function AddToCollectionButton({
  gameId,
  preferredPlatformId,
  preferredRegion,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [availableVersions, setAvailableVersions] = useState<
    AvailableVersion[]
  >([]);
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>(
    [],
  );
  const [platformId, setPlatformId] = useState("");
  const [format, setFormat] = useState("physical");
  const [region, setRegion] = useState<Region | "">("");
  const [status, setStatus] = useState("owned");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [isLoadingCollection, setIsLoadingCollection] = useState(true);
  const [removingEntryId, setRemovingEntryId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const refreshCollectionEntries = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setIsLoadingCollection(true);
      }

      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setCollectionEntries([]);
        setIsLoadingCollection(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_collections")
        .select(
          `
            id,
            platform_id,
            status,
            format,
            region,
            platforms (
              id,
              name,
              is_legacy,
              display_order
            )
          `,
        )
        .eq("user_id", userData.user.id)
        .eq("game_id", gameId)
        .order("id", { ascending: true });

      if (error) {
        setMessage("Impossible de charger ta collection pour ce jeu.");
        setIsLoadingCollection(false);
        return;
      }

      const entries = ((data ?? []) as RawCollectionEntry[]).map((entry) => ({
        id: entry.id,
        platform: normalizeRelation(entry.platforms),
        status: entry.status,
        format: entry.format,
        region: entry.region,
      }));

      setCollectionEntries(entries);
      setIsLoadingCollection(false);
    },
    [gameId, supabase],
  );

  useEffect(() => {
    async function loadPlatforms() {
      setIsLoadingPlatforms(true);

      const { data, error } = await supabase
        .from("game_platforms")
        .select(
          `
            platform_id,
            region,
            physical,
            digital,
            platforms (
              id,
              name,
              is_legacy,
              display_order
            )
          `,
        )
        .eq("game_id", gameId);

      if (error) {
        setMessage("Impossible de charger les versions disponibles.");
        setIsLoadingPlatforms(false);
        return;
      }

      const versions = ((data ?? []) as RawGamePlatform[])
        .map((gamePlatform) => {
          const platform = normalizeRelation(gamePlatform.platforms);

          if (!platform) {
            return null;
          }

          return {
            platform,
            region: gamePlatform.region,
            physical: Boolean(gamePlatform.physical),
            digital: Boolean(gamePlatform.digital),
          };
        })
        .filter(
          (version): version is AvailableVersion => version !== null,
        );

      setAvailableVersions(versions);

      const preferredVersion = versions.find(
        (version) =>
          version.platform.id === preferredPlatformId &&
          version.region === preferredRegion,
      );

      const initialVersion =
        preferredVersion ??
        [...versions].sort((a, b) =>
          comparePlatforms(a.platform, b.platform),
        )[0];

      if (initialVersion) {
        setPlatformId(String(initialVersion.platform.id));
        setRegion(initialVersion.region);
        setFormat(getInitialFormat(initialVersion));
      }

      setIsLoadingPlatforms(false);
    }

    void loadPlatforms();
  }, [gameId, preferredPlatformId, preferredRegion, supabase]);

  useEffect(() => {
    void refreshCollectionEntries(true);
  }, [refreshCollectionEntries]);

  useEffect(() => {
    if (!preferredPlatformId || !preferredRegion) {
      return;
    }

    const version = availableVersions.find(
      (item) =>
        item.platform.id === preferredPlatformId &&
        item.region === preferredRegion,
    );

    if (!version) {
      return;
    }

    setPlatformId(String(version.platform.id));
    setRegion(version.region);
    setFormat(getInitialFormat(version));
  }, [availableVersions, preferredPlatformId, preferredRegion]);

  const platforms = useMemo(
    () =>
      Array.from(
        new Map(
          availableVersions.map((version) => [
            version.platform.id,
            version.platform,
          ]),
        ).values(),
      ).sort(comparePlatforms),
    [availableVersions],
  );

  const regions = useMemo<Region[]>(
    () =>
      Array.from(
        new Set(
          availableVersions
            .filter(
              (version) =>
                version.platform.id === Number(platformId),
            )
            .map((version) => version.region),
        ),
      ),
    [availableVersions, platformId],
  );

  const selectedVersion = availableVersions.find(
    (version) =>
      version.platform.id === Number(platformId) &&
      version.region === region,
  );

  const formats = useMemo(() => {
    if (!selectedVersion) {
      return [];
    }

    const result: { value: string; label: string }[] = [];

    if (selectedVersion.physical) {
      result.push({ value: "physical", label: "Physique" });
    }

    if (selectedVersion.digital) {
      result.push({ value: "digital", label: "Numérique" });
    }

    if (selectedVersion.physical && selectedVersion.digital) {
      result.push({ value: "both", label: "Les deux" });
    }

    if (result.length === 0) {
      result.push(
        { value: "physical", label: "Physique" },
        { value: "digital", label: "Numérique" },
      );
    }

    return result;
  }, [selectedVersion]);

  useEffect(() => {
    if (regions.length > 0 && !regions.includes(region as Region)) {
      setRegion(regions[0]);
    }
  }, [region, regions]);

  useEffect(() => {
    if (formats.length > 0 && !formats.some((item) => item.value === format)) {
      setFormat(formats[0].value);
    }
  }, [format, formats]);

  function handlePlatformChange(value: string) {
    setPlatformId(value);

    const firstVersion = availableVersions.find(
      (version) => version.platform.id === Number(value),
    );

    if (firstVersion) {
      setRegion(firstVersion.region);
      setFormat(getInitialFormat(firstVersion));
    }
  }

  function handleRegionChange(value: Region) {
    setRegion(value);

    const version = availableVersions.find(
      (item) =>
        item.platform.id === Number(platformId) && item.region === value,
    );

    if (version) {
      setFormat(getInitialFormat(version));
    }
  }

  async function addToCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/auth/login";
      return;
    }

    if (!platformId || !region) {
      setMessage("Aucune version ne peut être ajoutée pour ce jeu.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("user_collections").insert({
      user_id: userData.user.id,
      game_id: gameId,
      platform_id: Number(platformId),
      status,
      format,
      region,
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Cette version est déjà présente dans ta collection."
          : "Impossible d’ajouter le jeu pour le moment.",
      );
      setIsLoading(false);
      return;
    }

    await refreshCollectionEntries();
    setMessage("Version ajoutée à ta collection.");
    setIsLoading(false);
    setIsOpen(false);
    router.refresh();
  }

  async function removeFromCollection(entry: CollectionEntry) {
    const platformName = entry.platform?.name ?? "cette version";
    const regionLabel = entry.region ? ` · ${entry.region}` : "";

    if (
      !window.confirm(
        `Retirer ${platformName}${regionLabel} de ta collection ?`,
      )
    ) {
      return;
    }

    setMessage("");
    setRemovingEntryId(entry.id);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/auth/login";
      return;
    }

    const { error } = await supabase
      .from("user_collections")
      .delete()
      .eq("id", entry.id)
      .eq("user_id", userData.user.id)
      .eq("game_id", gameId);

    if (error) {
      setMessage("Impossible de retirer cette version pour le moment.");
      setRemovingEntryId(null);
      return;
    }

    setCollectionEntries((currentEntries) =>
      currentEntries.filter((currentEntry) => currentEntry.id !== entry.id),
    );
    setMessage("Version retirée de ta collection.");
    setRemovingEntryId(null);
    router.refresh();
  }

  if (isLoadingPlatforms || isLoadingCollection) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
        Préparation de ta collection…
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
        Aucune version n’est encore disponible pour la collection.
      </div>
    );
  }

  if (!isOpen && collectionEntries.length > 0) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-200">
              ✓ Dans ma collection
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {collectionEntries.length === 1
                ? "1 version enregistrée"
                : `${collectionEntries.length} versions enregistrées`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setMessage("");
            }}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-purple-500 hover:text-purple-200"
          >
            + Ajouter une autre version
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {collectionEntries.map((entry) => {
            const details = [
              entry.region,
              getFormatLabel(entry.format),
              getStatusLabel(entry.status),
            ].filter(Boolean);

            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {entry.platform?.name ?? "Plateforme"}
                  </p>
                  {details.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      {details.join(" · ")}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={removingEntryId === entry.id}
                  onClick={() => void removeFromCollection(entry)}
                  className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:border-red-400 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {removingEntryId === entry.id ? "Suppression…" : "Retirer"}
                </button>
              </div>
            );
          })}
        </div>

        {message && (
          <p aria-live="polite" className="mt-3 text-sm text-slate-300">
            {message}
          </p>
        )}
      </section>
    );
  }

  if (!isOpen) {
    return (
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setMessage("");
          }}
          className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-500"
        >
          + Ajouter à ma collection
        </button>

        {message && (
          <p aria-live="polite" className="text-sm text-slate-300">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={addToCollection}
      className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">
            {collectionEntries.length > 0
              ? "Ajouter une autre version"
              : "Ajouter à ma collection"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choisis la version que tu possèdes ou souhaites suivre.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
        >
          Fermer
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Plateforme
          </span>
          <select
            value={platformId}
            onChange={(event) => handlePlatformChange(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Région
          </span>
          <select
            value={region}
            onChange={(event) =>
              handleRegionChange(event.target.value as Region)
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Format
          </span>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            {formats.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Statut
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {isLoading ? "Ajout en cours…" : "Confirmer l’ajout"}
        </button>

        {message && (
          <p aria-live="polite" className="text-sm text-slate-300">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
