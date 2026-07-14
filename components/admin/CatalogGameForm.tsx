"use client";

import { useMemo, useState } from "react";

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
  };
}

export default function CatalogGameForm({
  action,
  platforms,
  submitLabel,
  initialGame,
  initialPlatforms,
}: Props) {
  const firstPlatformId = platforms[0]?.id ?? 0;

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
            <span className="text-sm font-medium text-slate-200">
              Titre *
            </span>
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

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">
              URL de la jaquette
            </span>
            <input
              name="cover_url"
              type="url"
              defaultValue={initialGame?.cover_url ?? ""}
              className="rounded-xl border px-4 py-3"
              placeholder="https://..."
            />
          </label>

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
              Ces versions servent aux filtres et à la collection. Elles ne
              sont pas ajoutées au calendrier des sorties.
            </p>
          </div>

          <button
            type="button"
            onClick={addPlatform}
            disabled={platforms.length === 0}
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
            {catalogPlatforms.map((catalogPlatform, index) => (
              <div
                key={catalogPlatform.key}
                className="grid gap-4 rounded-xl border border-slate-700 p-4 lg:grid-cols-[1.3fr_0.7fr_0.9fr_0.8fr_1fr_auto]"
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

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removePlatform(catalogPlatform.key)}
                    disabled={catalogPlatforms.length === 1}
                    className="rounded-xl border border-red-500/40 px-3 py-2 text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Supprimer le support ${index + 1}`}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="submit"
          disabled={platforms.length === 0 || catalogPlatforms.length === 0}
          className="jrpg-button-primary px-6 py-3 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
