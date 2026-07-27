"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

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

type AvailableVersion = {
  platform: PlatformRelation;
  region: Region;
  physical: boolean;
  digital: boolean;
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

export default function AddToCollectionButton({
  gameId,
  preferredPlatformId,
  preferredRegion,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [availableVersions, setAvailableVersions] = useState<
    AvailableVersion[]
  >([]);
  const [platformId, setPlatformId] = useState("");
  const [format, setFormat] = useState("physical");
  const [region, setRegion] = useState<Region | "">("");
  const [status, setStatus] = useState("owned");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

    setMessage("Jeu ajouté à ta collection.");
    setIsLoading(false);
  }

  if (isLoadingPlatforms) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
        Préparation des versions disponibles…
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

  if (!isOpen) {
    return (
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
    );
  }

  return (
    <form
      onSubmit={addToCollection}
      className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-white">Ajouter à ma collection</h2>
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
