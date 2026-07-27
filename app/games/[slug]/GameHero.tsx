"use client";

import { useMemo, useState } from "react";
import AddToCollectionButton, { type Region } from "./AddToCollectionButton";
import FollowGameButton from "./FollowGameButton";

export type GameCoverOption = {
  key: string;
  platformId: number;
  platformName: string;
  region: Region;
  coverUrl: string;
};

type HeroTag = {
  id: number;
  name: string;
};

type Props = {
  gameId: number;
  title: string;
  series: string | null;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  releaseYear: number | null;
  firstReleaseDate: string | null;
  defaultCoverUrl: string | null;
  coverOptions: GameCoverOption[];
  tags: HeroTag[];
  platformNames: string[];
  initialIsFollowed: boolean;
};

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function clampRatio(width: number, height: number) {
  if (!width || !height) {
    return 0.75;
  }

  return Math.min(1.1, Math.max(0.62, width / height));
}

export default function GameHero({
  gameId,
  title,
  series,
  description,
  developer,
  publisher,
  releaseYear,
  firstReleaseDate,
  defaultCoverUrl,
  coverOptions,
  tags,
  platformNames,
  initialIsFollowed,
}: Props) {
  const [activeCoverKey, setActiveCoverKey] = useState<string | null>(null);
  const [coverRatio, setCoverRatio] = useState(0.75);
  const [imageFailed, setImageFailed] = useState(false);

  const activeOption = useMemo(
    () => coverOptions.find((option) => option.key === activeCoverKey) ?? null,
    [activeCoverKey, coverOptions],
  );

  const activeCoverUrl = activeOption?.coverUrl ?? defaultCoverUrl;
  const formattedFirstRelease = formatDate(firstReleaseDate);
  const preferredPlatformId = activeOption?.platformId ?? null;
  const preferredRegion = activeOption?.region ?? null;

  function selectDefaultCover() {
    setActiveCoverKey(null);
    setImageFailed(false);
    setCoverRatio(0.75);
  }

  function selectCover(option: GameCoverOption) {
    setActiveCoverKey(option.key);
    setImageFailed(false);
    setCoverRatio(0.75);
  }

  return (
    <section className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-purple-950/35">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <a
          href="/games"
          className="inline-flex items-center gap-2 text-sm font-medium text-purple-300 transition hover:text-purple-200"
        >
          <span aria-hidden="true">←</span>
          Retour au catalogue
        </a>

        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <div
              className="mx-auto flex w-full max-w-[360px] items-center justify-center overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/30 transition-[aspect-ratio] duration-200 lg:mx-0"
              style={{ aspectRatio: coverRatio }}
            >
              {activeCoverUrl && !imageFailed ? (
                <img
                  key={activeCoverUrl}
                  src={activeCoverUrl}
                  alt={
                    activeOption
                      ? `Jaquette ${activeOption.platformName} ${activeOption.region} de ${title}`
                      : `Jaquette de ${title}`
                  }
                  className="h-full w-full bg-slate-950 object-contain"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    setCoverRatio(
                      clampRatio(image.naturalWidth, image.naturalHeight),
                    );
                  }}
                  onError={() => {
                    if (activeOption && defaultCoverUrl) {
                      selectDefaultCover();
                      return;
                    }

                    setImageFailed(true);
                  }}
                />
              ) : (
                <div className="flex min-h-72 w-full items-center justify-center px-8 text-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-400">
                      JRPG Vault
                    </p>
                    <p className="mt-3 text-2xl font-bold text-purple-200">{title}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Jaquette non disponible
                    </p>
                  </div>
                </div>
              )}
            </div>

            {coverOptions.length > 0 && (
              <div className="mx-auto mt-4 max-w-[360px] lg:mx-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Versions de la jaquette
                </p>

                <div className="mt-2 flex flex-nowrap gap-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={selectDefaultCover}
                    aria-pressed={activeCoverKey === null}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      activeCoverKey === null
                        ? "border-purple-400 bg-purple-500/15 text-purple-100"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    Par défaut
                  </button>

                  {coverOptions.map((option) => {
                    const isActive = option.key === activeCoverKey;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => selectCover(option)}
                        aria-pressed={isActive}
                        className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "border-purple-400 bg-purple-500/15 text-purple-100"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {option.platformName} · {option.region}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 pt-1">
            {series && (
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-purple-400">
                {series}
              </p>
            )}

            <h1 className="mt-2 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {description && (
              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>
            )}

            <dl className="mt-7 grid max-w-4xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(formattedFirstRelease || releaseYear) && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Première sortie
                  </dt>
                  <dd className="mt-2 font-semibold text-white">
                    {formattedFirstRelease ?? releaseYear}
                  </dd>
                </div>
              )}

              {developer && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Développeur
                  </dt>
                  <dd className="mt-2 font-semibold text-white">{developer}</dd>
                </div>
              )}

              {publisher && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Éditeur
                  </dt>
                  <dd className="mt-2 font-semibold text-white">{publisher}</dd>
                </div>
              )}

              {platformNames.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/65 p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Plateformes
                  </dt>
                  <dd className="mt-2 line-clamp-2 font-semibold text-white">
                    {platformNames.join(", ")}
                  </dd>
                </div>
              )}
            </dl>

            {tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-purple-500/35 bg-purple-950/60 px-3 py-1.5 text-sm font-medium text-purple-200"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 grid max-w-4xl gap-3 border-t border-slate-800 pt-6 xl:grid-cols-[minmax(0,1fr)_220px]">
              <AddToCollectionButton
                gameId={gameId}
                preferredPlatformId={preferredPlatformId}
                preferredRegion={preferredRegion}
              />

              <FollowGameButton
                gameId={gameId}
                initialIsFollowed={initialIsFollowed}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
