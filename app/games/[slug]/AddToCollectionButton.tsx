"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

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
  cover_url: string | null;
  platforms: PlatformRelation | PlatformRelation[] | null;
};

type AvailableVersion = {
  platform: PlatformRelation;
  region: Region;
  physical: boolean;
  digital: boolean;
  coverUrl: string | null;
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
}: {
  gameId: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const formRef = useRef<HTMLFormElement>(null);
  const originalCoverMarkupRef = useRef<string | null>(null);
  const coverContainerRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    const form = formRef.current;
    const actionPanel = form?.parentElement;
    const coverContainer = actionPanel?.previousElementSibling;

    if (coverContainer instanceof HTMLElement) {
      coverContainerRef.current = coverContainer;
      originalCoverMarkupRef.current = coverContainer.innerHTML;
    }

    return () => {
      if (coverContainerRef.current && originalCoverMarkupRef.current !== null) {
        coverContainerRef.current.innerHTML = originalCoverMarkupRef.current;
      }
    };
  }, []);

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
            cover_url,
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
            coverUrl: gamePlatform.cover_url,
          };
        })
        .filter(
          (version): version is AvailableVersion => version !== null,
        );

      setAvailableVersions(versions);

      if (versions.length > 0) {
        const sortedPlatforms = Array.from(
          new Map(
            versions.map((version) => [
              version.platform.id,
              version.platform,
            ]),
          ).values(),
        ).sort(comparePlatforms);

        const firstPlatform = sortedPlatforms[0];
        const firstVersion = versions.find(
          (version) => version.platform.id === firstPlatform.id,
        );

        setPlatformId(String(firstPlatform.id));
        setRegion(firstVersion?.region ?? "WORLD");

        if (firstVersion) {
          setFormat(getInitialFormat(firstVersion));
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

  const coverVersions = useMemo(
    () => availableVersions.filter((version) => Boolean(version.coverUrl)),
    [availableVersions],
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

  useEffect(() => {
    const coverContainer = coverContainerRef.current;

    if (!coverContainer || originalCoverMarkupRef.current === null) {
      return;
    }

    if (!selectedVersion?.coverUrl) {
      coverContainer.innerHTML = originalCoverMarkupRef.current;
      return;
    }

    const image = document.createElement("img");
    image.src = selectedVersion.coverUrl;
    image.alt = `Jaquette ${selectedVersion.platform.name} ${selectedVersion.region}`;
    image.className = "aspect-[3/4] w-full object-cover";

    coverContainer.replaceChildren(image);
  }, [selectedVersion]);

  function selectVersion(version: AvailableVersion) {
    setPlatformId(String(version.platform.id));
    setRegion(version.region);
    setFormat(getInitialFormat(version));
  }

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

  async function addToCollection(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("Connecte-toi pour ajouter ce jeu.");
      setIsLoading(false);
      return;
    }

    if (!platformId || !region) {
      setMessage("Aucun support n’est disponible pour ce jeu.");
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

      setIsLoading(false);
      return;
    }

    setMessage("Jeu ajouté à ta collection.");
    setIsLoading(false);
  }

  if (isLoadingPlatforms) {
    return (
      <div className="jrpg-card p-4 text-sm text-slate-400">
        Chargement des supports…
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="jrpg-card p-4">
        <h2 className="text-xl font-semibold">Ajouter à ma collection</h2>
        <p className="mt-3 text-sm text-amber-300">
          Aucun support n’est encore associé à ce jeu.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={addToCollection} className="jrpg-card p-4">
      {coverVersions.length > 0 && (
        <div className="mb-5 border-b border-slate-800 pb-5">
          <p className="text-sm font-semibold text-slate-200">
            Jaquettes disponibles
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Choisis une console et une région pour afficher sa jaquette.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {coverVersions.map((version) => {
              const isSelected =
                version.platform.id === Number(platformId) &&
                version.region === region;

              return (
                <button
                  key={`${version.platform.id}-${version.region}`}
                  type="button"
                  onClick={() => selectVersion(version)}
                  aria-pressed={isSelected}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    isSelected
                      ? "border-purple-400 bg-purple-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
                >
                  <img
                    src={version.coverUrl ?? ""}
                    alt={`Jaquette ${version.platform.name} ${version.region}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <span className="block px-2 py-2 text-xs font-medium text-slate-200">
                    {version.platform.name} · {version.region}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold">Ajouter à ma collection</h2>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">
            Plateforme
          </span>
          <select
            value={platformId}
            onChange={(event) => handlePlatformChange(event.target.value)}
            className="rounded border px-3 py-2"
          >
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">Format</span>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="rounded border px-3 py-2"
          >
            {formats.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">Région</span>
          <select
            value={region}
            onChange={(event) =>
              handleRegionChange(event.target.value as Region)
            }
            className="rounded border px-3 py-2"
          >
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">Statut</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded border px-3 py-2"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="jrpg-button-primary mt-4 px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? "Ajout..." : "Ajouter à ma collection"}
      </button>

      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </form>
  );
}
