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

function getVersionKey(version: AvailableVersion) {
  return `${version.platform.id}:${version.region}`;
}

function adaptCoverToImage(
  container: HTMLElement,
  image: HTMLImageElement,
) {
  const updateSize = () => {
    if (!image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const displayRatio = Math.min(1.1, Math.max(0.62, naturalRatio));

    container.style.aspectRatio = String(displayRatio);
    image.className = "h-full w-full object-contain";
  };

  if (image.complete && image.naturalWidth > 0) {
    updateSize();
  } else {
    image.addEventListener("load", updateSize, { once: true });
  }
}

export default function AddToCollectionButton({
  gameId,
}: {
  gameId: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const formRef = useRef<HTMLFormElement>(null);
  const coverContainerRef = useRef<HTMLElement | null>(null);
  const defaultCoverMarkupRef = useRef<string | null>(null);

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
  const [activeCoverKey, setActiveCoverKey] = useState<string | null>(null);

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

    void loadPlatforms();
  }, [gameId, supabase]);

  useEffect(() => {
    if (isLoadingPlatforms) {
      return;
    }

    const form = formRef.current;
    const actionPanel = form?.parentElement;
    const coverContainer = actionPanel?.previousElementSibling;

    if (!(coverContainer instanceof HTMLElement)) {
      return;
    }

    coverContainerRef.current = coverContainer;

    if (defaultCoverMarkupRef.current === null) {
      defaultCoverMarkupRef.current = coverContainer.innerHTML;
    }

    const currentImage = coverContainer.querySelector("img");

    if (currentImage instanceof HTMLImageElement) {
      adaptCoverToImage(coverContainer, currentImage);
    } else {
      coverContainer.style.aspectRatio = "3 / 4";
    }
  }, [isLoadingPlatforms]);

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
    () =>
      availableVersions
        .filter((version) => Boolean(version.coverUrl))
        .sort((a, b) => {
          const platformComparison = comparePlatforms(a.platform, b.platform);

          if (platformComparison !== 0) {
            return platformComparison;
          }

          return a.region.localeCompare(b.region, "fr");
        }),
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

  function restoreDefaultCover() {
    const coverContainer = coverContainerRef.current;
    const defaultMarkup = defaultCoverMarkupRef.current;

    if (!coverContainer || defaultMarkup === null) {
      return;
    }

    coverContainer.innerHTML = defaultMarkup;
    const image = coverContainer.querySelector("img");

    if (image instanceof HTMLImageElement) {
      adaptCoverToImage(coverContainer, image);
    } else {
      coverContainer.style.aspectRatio = "3 / 4";
    }
  }

  function showVersionCover(version: AvailableVersion) {
    const coverContainer = coverContainerRef.current;

    if (!coverContainer || !version.coverUrl) {
      restoreDefaultCover();
      return;
    }

    const image = document.createElement("img");
    image.src = version.coverUrl;
    image.alt = `Jaquette ${version.platform.name} ${version.region}`;
    image.className = "h-full w-full object-contain";

    image.addEventListener(
      "error",
      () => {
        restoreDefaultCover();
        setActiveCoverKey(null);
      },
      { once: true },
    );

    coverContainer.style.aspectRatio = "3 / 4";
    coverContainer.replaceChildren(image);
    adaptCoverToImage(coverContainer, image);
  }

  function selectDefaultCover() {
    setActiveCoverKey(null);
    restoreDefaultCover();
  }

  function selectCoverVersion(version: AvailableVersion) {
    setActiveCoverKey(getVersionKey(version));
    setPlatformId(String(version.platform.id));
    setRegion(version.region);
    setFormat(getInitialFormat(version));
    showVersionCover(version);
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
            Choisir la jaquette affichée
          </p>
          <p className="mt-1 text-xs text-slate-500">
            La fiche s’ouvre sur la jaquette par défaut du catalogue.
          </p>

          <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={selectDefaultCover}
              aria-pressed={activeCoverKey === null}
              className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                activeCoverKey === null
                  ? "border-purple-400 bg-purple-500/15 text-purple-100"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
              }`}
            >
              Jaquette par défaut
            </button>

            {coverVersions.map((version) => {
              const versionKey = getVersionKey(version);
              const isSelected = activeCoverKey === versionKey;

              return (
                <button
                  key={versionKey}
                  type="button"
                  onClick={() => selectCoverVersion(version)}
                  aria-pressed={isSelected}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? "border-purple-400 bg-purple-500/15 text-purple-100"
                      : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {version.platform.name} · {version.region}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold">Ajouter à ma collection</h2>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">Plateforme</span>
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
            onChange={(event) => handleRegionChange(event.target.value as Region)}
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
