"use client";

import { useMemo, useState } from "react";
import CoverImageUploader from "@/components/admin/CoverImageUploader";

export type CatalogPlatform = {
  id: number;
  name: string;
  is_legacy: boolean;
  display_order: number;
};

export type CatalogPlatformValue = {
  key: string;
  platform_id: number;
  region: "PAL" | "US" | "JAP" | "ASIA" | "WORLD";
  release_date: string;
  release_format: "physical" | "digital" | "both";
  edition_name: string;
  cover_url: string;
};

export type CatalogGameValue = {
  title: string;
  slug: string;
  description: string;
  developer: string;
  publisher: string;
  series: string;
  cover_url: string;
  release_year: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  platforms: CatalogPlatform[];
  submitLabel: string;
  initialGame?: CatalogGameValue;
  initialPlatforms?: CatalogPlatformValue[];
};

const regions = ["PAL", "US", "JAP", "ASIA", "WORLD"] as const;
let nextTemporaryKey = 1;

function createEmptyPlatform(platformId: number): CatalogPlatformValue {
  const key = `new-platform-${nextTemporaryKey}`;
  nextTemporaryKey += 1;

  return {
    key,
    platform_id: platformId,
    region: "PAL",
    release_date: "",
    release_format: "physical",
    edition_name: "",
    cover_url: "",
  };
}

export default function CatalogGameUploadForm({
  action,
  platforms,
  submitLabel,
  initialGame,
  initialPlatforms,
}: Props) {
  const firstPlatformId = platforms[0]?.id ?? 0;
  const [catalogCoverUrl, setCatalogCoverUrl] = useState(
    initialGame?.cover_url ?? "",
  );
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([]);
  const [catalogPlatforms, setCatalogPlatforms] = useState<
    CatalogPlatformValue[]
  >(
    initialPlatforms && initialPlatforms.length > 0
      ? initialPlatforms
      : firstPlatformId
        ? [createEmptyPlatform(firstPlatformId)]
        : [],
  );

  const currentPlatforms = useMemo(
    () =>
      platforms
        .filter((platform) => !platform.is_legacy)
        .sort(
          (a, b) =>
            a.display_order - b.display_order ||
            a.name.localeCompare(b.name, "fr"),
        ),
    [platforms],
  );

  const legacyPlatforms = useMemo(
    () =>
      platforms
        .filter((platform) => platform.is_legacy)
        .sort(
          (a, b) =>
            a.display_order - b.display_order ||
            a.name.localeCompare(b.name, "fr"),
        ),
    [platforms],
  );

  const platformNames = useMemo(
    () => new Map(platforms.map((platform) => [platform.id, platform.name])),
    [platforms],
  );

  const isUploading = uploadingKeys.length > 0;

  function setUploadState(key: string, uploading: boolean) {
    setUploadingKeys((current) => {
      if (uploading) {
        return current.includes(key) ? current : [...current, key];
      }

      return current.filter((item) => item !== key);
    });
  }

  function updatePlatform(
    key: string,
    field: keyof Omit<CatalogPlatformValue, "key">,
    value: string | number,
  ) {
    setCatalogPlatforms((current) =>
      current.map((platform) =>
        platform.key === key ? { ...platform, [field]: value } : platform,
      ),
    );
  }

  function updateVersionCover(key: string, url: string) {
    const currentVersion = catalogPlatforms.find(
      (platform) => platform.key === key,
    );
    const wasCatalogDefault =
      Boolean(currentVersion?.cover_url) &&
      currentVersion?.cover_url === catalogCoverUrl;

    updatePlatform(key, "cover_url", url);

    if (wasCatalogDefault) {
      setCatalogCoverUrl(url);
    }
  }

  function addPlatform() {
    if (!firstPlatformId) {
      return;
    }

    setCatalogPlatforms((current) => [
      ...current,
      createEmptyPlatform(firstPlatformId),
    ]);
  }

  function removePlatform(key: string) {
    const removedVersion = catalogPlatforms.find(
      (platform) => platform.key === key,
    );

    if (
      removedVersion?.cover_url &&
      removedVersion.cover_url === catalogCoverUrl
    ) {
      setCatalogCoverUrl("");
    }

    setCatalogPlatforms((current) =>
      current.length === 1
        ? current
        : current.filter((platform) => platform.key !== key),
    );
  }

  return (
    <form action={action} className="mt-8 grid gap-8">
      <section className="jrpg-card grid gap-5 p-6">
        <div>
          <h2 className="text-2xl font-bold">Informations du jeu</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ces informations alimentent la fiche publique du catalogue.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">Titre *</span>
            <input
              name="title"
              required
              defaultValue={initialGame?.title ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Final Fantasy VII"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Slug</span>
            <input
              name="slug"
              defaultValue={initialGame?.slug ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Laisser vide pour le générer"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Année principale
            </span>
            <input
              name="release_year"
              type="number"
              min="1970"
              max="2100"
              defaultValue={initialGame?.release_year ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="1997"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Série</span>
            <input
              name="series"
              defaultValue={initialGame?.series ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Final Fantasy"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              Développeur
            </span>
            <input
              name="developer"
              defaultValue={initialGame?.developer ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Square"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Éditeur</span>
            <input
              name="publisher"
              defaultValue={initialGame?.publisher ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Sony Computer Entertainment"
            />
          </label>

          <div className="md:col-span-2 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
            <input type="hidden" name="cover_url" value={catalogCoverUrl} />
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-300">
                Jaquette par défaut du catalogue
              </p>
              <p className="mt-1 text-sm text-slate-400">
                C’est cette image qui apparaît dans le catalogue et à l’ouverture
                de la fiche du jeu. Tu peux importer une image dédiée ici ou
                choisir plus bas la jaquette d’une version.
              </p>
            </div>
            <CoverImageUploader
              value={catalogCoverUrl}
              onChange={setCatalogCoverUrl}
              label="Image utilisée par défaut"
              helperText="Elle reste affichée tant que le visiteur ne choisit pas une autre console ou région."
              folder="catalog-defaults"
              previewAlt="Aperçu de la jaquette par défaut du catalogue"
              onUploadingChange={(uploading) =>
                setUploadState("catalog-cover", uploading)
              }
            />
          </div>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-200">
              Description
            </span>
            <textarea
              name="description"
              rows={7}
              defaultValue={initialGame?.description ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="Présentation du jeu..."
            />
          </label>
        </div>
      </section>

      <section className="jrpg-card grid gap-5 p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Versions disponibles</h2>
            <p className="mt-1 text-sm text-slate-400">
              Chaque combinaison support + région peut posséder sa propre
              jaquette. Une de ces images peut être désignée comme jaquette par
              défaut du catalogue.
            </p>
          </div>

          <button
            type="button"
            onClick={addPlatform}
            disabled={platforms.length === 0 || isUploading}
            className="jrpg-button-secondary px-4 py-2 disabled:opacity-50"
          >
            + Ajouter un support
          </button>
        </div>

        {platforms.length === 0 ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            Aucune plateforme n’est disponible dans la base.
          </p>
        ) : (
          <div className="grid gap-4">
            {catalogPlatforms.map((catalogPlatform, index) => {
              const platformName =
                platformNames.get(catalogPlatform.platform_id) ?? "plateforme";
              const uploadKey = `version-cover-${catalogPlatform.key}`;
              const isCatalogDefault =
                Boolean(catalogPlatform.cover_url) &&
                catalogPlatform.cover_url === catalogCoverUrl;

              return (
                <div
                  key={catalogPlatform.key}
                  className={`grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-4 ${
                    isCatalogDefault
                      ? "border-purple-400 bg-purple-500/10"
                      : "border-slate-700 bg-slate-950/40"
                  }`}
                >
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Support
                    </span>
                    <select
                      name="platform_id"
                      value={catalogPlatform.platform_id}
                      onChange={(event) =>
                        updatePlatform(
                          catalogPlatform.key,
                          "platform_id",
                          Number(event.target.value),
                        )
                      }
                      className="rounded-xl border px-3 py-2"
                    >
                      {currentPlatforms.length > 0 && (
                        <optgroup label="Supports actuels">
                          {currentPlatforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.name}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {legacyPlatforms.length > 0 && (
                        <optgroup label="Supports rétro">
                          {legacyPlatforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Région
                    </span>
                    <select
                      name="region"
                      value={catalogPlatform.region}
                      onChange={(event) =>
                        updatePlatform(
                          catalogPlatform.key,
                          "region",
                          event.target.value,
                        )
                      }
                      className="rounded-xl border px-3 py-2"
                    >
                      {regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Date d’origine
                    </span>
                    <input
                      name="release_date"
                      type="date"
                      value={catalogPlatform.release_date}
                      onChange={(event) =>
                        updatePlatform(
                          catalogPlatform.key,
                          "release_date",
                          event.target.value,
                        )
                      }
                      className="rounded-xl border px-3 py-2"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Format
                    </span>
                    <select
                      name="release_format"
                      value={catalogPlatform.release_format}
                      onChange={(event) =>
                        updatePlatform(
                          catalogPlatform.key,
                          "release_format",
                          event.target.value,
                        )
                      }
                      className="rounded-xl border px-3 py-2"
                    >
                      <option value="physical">Physique</option>
                      <option value="digital">Numérique</option>
                      <option value="both">Les deux</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Édition
                    </span>
                    <input
                      name="edition_name"
                      value={catalogPlatform.edition_name}
                      onChange={(event) =>
                        updatePlatform(
                          catalogPlatform.key,
                          "edition_name",
                          event.target.value,
                        )
                      }
                      className="rounded-xl border px-3 py-2"
                      placeholder="Standard"
                    />
                  </label>

                  <div className="md:col-span-2 xl:col-span-3">
                    <input
                      type="hidden"
                      name="version_cover_url"
                      value={catalogPlatform.cover_url}
                    />
                    <CoverImageUploader
                      value={catalogPlatform.cover_url}
                      onChange={(url) =>
                        updateVersionCover(catalogPlatform.key, url)
                      }
                      label={`Jaquette ${platformName} · ${catalogPlatform.region}`}
                      helperText="Cette image sera affichée lorsque cette console et cette région sont choisies sur la fiche."
                      folder={`versions/${platformName}/${catalogPlatform.region}`}
                      previewAlt={`Aperçu de la jaquette ${platformName} ${catalogPlatform.region}`}
                      onUploadingChange={(uploading) =>
                        setUploadState(uploadKey, uploading)
                      }
                    />

                    {catalogPlatform.cover_url && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={isCatalogDefault || isUploading}
                          onClick={() =>
                            setCatalogCoverUrl(catalogPlatform.cover_url)
                          }
                          className="jrpg-button-secondary px-4 py-2 disabled:cursor-default disabled:opacity-60"
                        >
                          {isCatalogDefault
                            ? "Jaquette par défaut actuelle"
                            : "Utiliser par défaut dans le catalogue"}
                        </button>

                        {isCatalogDefault && (
                          <span className="rounded-full border border-purple-400/50 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-200">
                            Visible dans le catalogue
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removePlatform(catalogPlatform.key)}
                      disabled={catalogPlatforms.length === 1 || isUploading}
                      className="rounded-xl border border-red-500/40 px-3 py-2 text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Supprimer le support ${index + 1}`}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {isUploading && (
          <p aria-live="polite" className="text-sm text-purple-300">
            Envoi d’une image en cours…
          </p>
        )}

        <button
          type="submit"
          disabled={
            platforms.length === 0 ||
            catalogPlatforms.length === 0 ||
            isUploading
          }
          className="jrpg-button-primary px-6 py-3 disabled:cursor-wait disabled:opacity-50"
        >
          {isUploading ? "Attends la fin de l’envoi…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
