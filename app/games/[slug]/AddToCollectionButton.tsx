"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

type Region = "PAL" | "US" | "JAP" | "ASIA" | "WORLD";

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

type MessageType = "success" | "error" | "info";

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

  return a.display_order - b.display_order || a.name.localeCompare(b.name, "fr");
}

function getFormatLabel(value: string) {
  switch (value) {
    case "physical":
      return "Physique";
    case "digital":
      return "Numérique";
    case "both":
      return "Les deux";
    default:
      return value;
  }
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-purple-500"
      >
        {children}
      </select>
    </label>
  );
}

export default function AddToCollectionButton({ gameId }: { gameId: number }) {
  const supabase = useMemo(() => createClient(), []);

  const [availableVersions, setAvailableVersions] = useState<
    AvailableVersion[]
  >([]);
  const [platformId, setPlatformId] = useState("");
  const [format, setFormat] = useState("physical");
  const [region, setRegion] = useState<Region | "">("");
  const [status, setStatus] = useState("owned");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);

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
        setMessage(`Erreur plateformes : ${error.message}`);
        setMessageType("error");
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
        .filter((version): version is AvailableVersion => version !== null);

      setAvailableVersions(versions);

      if (versions.length > 0) {
        const sortedPlatforms = Array.from(
          new Map(
            versions.map((version) => [version.platform.id, version.platform]),
          ).values(),
        ).sort(comparePlatforms);

        const firstPlatform = sortedPlatforms[0];
        const firstVersion = versions.find(
          (version) => version.platform.id === firstPlatform.id,
        );

        setPlatformId(String(firstPlatform.id));
        setRegion(firstVersion?.region ?? "WORLD");

        if (firstVersion?.physical) {
          setFormat("physical");
        } else if (firstVersion?.digital) {
          setFormat("digital");
        }
      }

      setIsLoadingPlatforms(false);
    }

    loadPlatforms();
  }, [gameId, supabase]);

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
            .filter((version) => version.platform.id === Number(platformId))
            .map((version) => version.region),
        ),
      ),
    [availableVersions, platformId],
  );

  const selectedVersion = availableVersions.find(
    (version) =>
      version.platform.id === Number(platformId) && version.region === region,
  );

  const selectedPlatform = platforms.find(
    (platform) => platform.id === Number(platformId),
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

      if (firstVersion.physical) {
        setFormat("physical");
      } else if (firstVersion.digital) {
        setFormat("digital");
      }
    }
  }

  async function addToCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageType("info");
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("Connecte-toi pour ajouter ce jeu.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    if (!platformId || !region) {
      setMessage("Aucun support n’est disponible pour ce jeu.");
      setMessageType("error");
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
      if (error.code === "23505") {
        setMessage(
          "Ce jeu existe déjà dans ta collection avec cette plateforme, région et format.",
        );
      } else {
        setMessage(`Erreur : ${error.message}`);
      }

      setMessageType("error");
      setIsLoading(false);
      return;
    }

    setMessage("Jeu ajouté à ta collection.");
    setMessageType("success");
    setIsLoading(false);
  }

  if (isLoadingPlatforms) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 grid gap-3">
          <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
          <div className="h-10 animate-pulse rounded-xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-900/70 bg-amber-950/20 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          Mon Vault
        </p>

        <h2 className="mt-1 text-xl font-bold text-white">
          Ajout indisponible
        </h2>

        <p className="mt-3 text-sm leading-6 text-amber-200">
          Aucun support n’est encore associé à ce jeu. Ajoute d’abord une
          plateforme depuis l’admin.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={addToCollection}
      className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/25 p-5 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            Mon Vault
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            Ajouter à ma collection
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Choisis la version que tu possèdes ou que tu veux suivre dans ton
            backlog.
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-1 text-xs font-semibold text-purple-200">
          Collection
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {selectedPlatform && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200">
            {selectedPlatform.name}
          </span>
        )}

        {region && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200">
            Région {region}
          </span>
        )}

        {format && (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200">
            {getFormatLabel(format)}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SelectField label="Plateforme" value={platformId} onChange={handlePlatformChange}>
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </SelectField>

        <SelectField label="Format" value={format} onChange={setFormat}>
          {formats.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Région"
          value={region}
          onChange={(value) => setRegion(value as Region)}
        >
          {regions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectField>

        <SelectField label="Statut" value={status} onChange={setStatus}>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Ajout en cours..." : "+ Ajouter au Vault"}
      </button>

      {message && (
        <p
          className={
            messageType === "success"
              ? "mt-3 rounded-xl border border-green-500/40 bg-green-950/40 px-3 py-2 text-sm text-green-200"
              : messageType === "error"
                ? "mt-3 rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200"
                : "mt-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
