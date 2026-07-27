"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CoverRegion = "PAL" | "US" | "JAP";

type GameCover = {
  id: number;
  game_id: number;
  region: CoverRegion;
  cover_url: string;
  storage_path: string | null;
  is_default: boolean;
};

type MessageType = "success" | "error" | "info";

const regions: { value: CoverRegion; label: string }[] = [
  { value: "PAL", label: "PAL" },
  { value: "US", label: "US" },
  { value: "JAP", label: "JAP" },
];

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "jpg" || extension === "jpeg") {
    return "jpg";
  }

  if (extension === "png") {
    return "png";
  }

  if (extension === "webp") {
    return "webp";
  }

  return null;
}

function getRegionLabel(region: CoverRegion) {
  switch (region) {
    case "PAL":
      return "PAL";
    case "US":
      return "US";
    case "JAP":
      return "JAP";
  }
}

function getRegionOrder(region: CoverRegion) {
  switch (region) {
    case "PAL":
      return 1;
    case "US":
      return 2;
    case "JAP":
      return 3;
  }
}

export default function GameCoverManager({ gameId }: { gameId: number }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [covers, setCovers] = useState<GameCover[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingRegion, setUploadingRegion] = useState<CoverRegion | null>(
    null,
  );
  const [deletingRegion, setDeletingRegion] = useState<CoverRegion | null>(
    null,
  );
  const [defaultRegion, setDefaultRegion] = useState<CoverRegion | null>(null);

  async function loadCovers() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("game_covers")
      .select("id, game_id, region, cover_url, storage_path, is_default")
      .eq("game_id", gameId);

    if (error) {
      setMessage(`Erreur chargement jaquettes : ${error.message}`);
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const sortedCovers = ((data ?? []) as GameCover[]).sort(
      (a, b) =>
        getRegionOrder(a.region) - getRegionOrder(b.region) ||
        a.region.localeCompare(b.region, "fr"),
    );

    setCovers(sortedCovers);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCovers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function getCover(region: CoverRegion) {
    return covers.find((cover) => cover.region === region) ?? null;
  }

  async function updateMainGameCover(coverUrl: string | null) {
    const { error } = await supabase
      .from("games")
      .update({
        cover_url: coverUrl,
      })
      .eq("id", gameId);

    return error;
  }

  async function uploadCover(region: CoverRegion, file: File | null) {
    if (!file) {
      return;
    }

    setMessage("");
    setMessageType("info");

    const extension = getFileExtension(file);

    if (!extension) {
      setMessage("Format refusé. Utilise une image JPG, PNG ou WEBP.");
      setMessageType("error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image trop lourde. Limite : 5 Mo.");
      setMessageType("error");
      return;
    }

    setUploadingRegion(region);

    const existingCover = getCover(region);
    const existingDefaultCover = covers.find((cover) => cover.is_default);
    const shouldBeDefault = !existingDefaultCover || existingCover?.is_default;

    const storagePath = `${gameId}/${region}.${extension}`;

    if (existingCover?.storage_path && existingCover.storage_path !== storagePath) {
      await supabase.storage.from("game-covers").remove([existingCover.storage_path]);
    }

    const { error: uploadError } = await supabase.storage
      .from("game-covers")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setMessage(`Erreur upload : ${uploadError.message}`);
      setMessageType("error");
      setUploadingRegion(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("game-covers")
      .getPublicUrl(storagePath);

    const publicUrlWithCacheBuster = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: upsertError } = await supabase.from("game_covers").upsert(
      {
        game_id: gameId,
        region,
        cover_url: publicUrlWithCacheBuster,
        storage_path: storagePath,
        is_default: shouldBeDefault,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "game_id,region",
      },
    );

    if (upsertError) {
      setMessage(`Erreur sauvegarde : ${upsertError.message}`);
      setMessageType("error");
      setUploadingRegion(null);
      return;
    }

    if (shouldBeDefault) {
      const gameCoverError = await updateMainGameCover(publicUrlWithCacheBuster);

      if (gameCoverError) {
        setMessage(
          `Jaquette importée, mais erreur jaquette principale : ${gameCoverError.message}`,
        );
        setMessageType("error");
        setUploadingRegion(null);
        return;
      }
    }

    setMessage(
      shouldBeDefault
        ? `Jaquette ${getRegionLabel(region)} importée et définie comme jaquette principale.`
        : `Jaquette ${getRegionLabel(region)} importée.`,
    );
    setMessageType("success");
    setUploadingRegion(null);

    await loadCovers();
    router.refresh();
  }

  async function setAsDefault(region: CoverRegion) {
    const selectedCover = getCover(region);

    if (!selectedCover) {
      setMessage("Aucune jaquette à définir par défaut.");
      setMessageType("error");
      return;
    }

    setMessage("");
    setMessageType("info");
    setDefaultRegion(region);

    const { error: resetError } = await supabase
      .from("game_covers")
      .update({
        is_default: false,
        updated_at: new Date().toISOString(),
      })
      .eq("game_id", gameId);

    if (resetError) {
      setMessage(`Erreur : ${resetError.message}`);
      setMessageType("error");
      setDefaultRegion(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("game_covers")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("game_id", gameId)
      .eq("region", region);

    if (updateError) {
      setMessage(`Erreur : ${updateError.message}`);
      setMessageType("error");
      setDefaultRegion(null);
      return;
    }

    const gameCoverError = await updateMainGameCover(selectedCover.cover_url);

    if (gameCoverError) {
      setMessage(
        `Jaquette par défaut définie, mais erreur jaquette principale : ${gameCoverError.message}`,
      );
      setMessageType("error");
      setDefaultRegion(null);
      return;
    }

    setMessage(
      `Jaquette ${getRegionLabel(region)} définie comme jaquette principale.`,
    );
    setMessageType("success");
    setDefaultRegion(null);

    await loadCovers();
    router.refresh();
  }

  async function deleteCover(region: CoverRegion) {
    const cover = getCover(region);

    if (!cover) {
      return;
    }

    setMessage("");
    setMessageType("info");
    setDeletingRegion(region);

    if (cover.storage_path) {
      await supabase.storage.from("game-covers").remove([cover.storage_path]);
    }

    const { error } = await supabase
      .from("game_covers")
      .delete()
      .eq("game_id", gameId)
      .eq("region", region);

    if (error) {
      setMessage(`Erreur suppression : ${error.message}`);
      setMessageType("error");
      setDeletingRegion(null);
      return;
    }

    if (cover.is_default) {
      const remainingCovers = covers.filter((item) => item.id !== cover.id);
      const nextDefaultCover = remainingCovers[0] ?? null;

      if (nextDefaultCover) {
        const { error: nextDefaultError } = await supabase
          .from("game_covers")
          .update({
            is_default: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextDefaultCover.id);

        if (nextDefaultError) {
          setMessage(`Erreur nouveau défaut : ${nextDefaultError.message}`);
          setMessageType("error");
          setDeletingRegion(null);
          return;
        }

        const gameCoverError = await updateMainGameCover(
          nextDefaultCover.cover_url,
        );

        if (gameCoverError) {
          setMessage(
            `Jaquette supprimée, mais erreur jaquette principale : ${gameCoverError.message}`,
          );
          setMessageType("error");
          setDeletingRegion(null);
          return;
        }
      } else {
        const gameCoverError = await updateMainGameCover(null);

        if (gameCoverError) {
          setMessage(
            `Jaquette supprimée, mais erreur jaquette principale : ${gameCoverError.message}`,
          );
          setMessageType("error");
          setDeletingRegion(null);
          return;
        }
      }
    }

    setMessage(`Jaquette ${getRegionLabel(region)} supprimée.`);
    setMessageType("success");
    setDeletingRegion(null);

    await loadCovers();
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            Jaquettes
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Jaquettes régionales
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Importe les jaquettes PAL, US et JAP depuis ton PC. La jaquette par
            défaut devient aussi la jaquette principale du catalogue.
          </p>
        </div>

        <span className="rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-1 text-xs font-semibold text-purple-200">
          {covers.length}/3
        </span>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
          Chargement des jaquettes…
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {regions.map((region) => {
            const cover = getCover(region.value);
            const isUploading = uploadingRegion === region.value;
            const isDeleting = deletingRegion === region.value;
            const isDefaultLoading = defaultRegion === region.value;

            return (
              <article
                key={region.value}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"
              >
                <div className="relative aspect-[3/4] bg-slate-900">
                  {cover ? (
                    <img
                      src={cover.cover_url}
                      alt={`Jaquette ${region.label}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">
                      Aucune jaquette
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded bg-slate-950/90 px-2 py-1 text-xs font-bold text-white">
                      {region.label}
                    </span>

                    {cover?.is_default && (
                      <span className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                        Défaut
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 p-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      Importer depuis le PC
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        uploadCover(region.value, file);
                        event.target.value = "";
                      }}
                      className="block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={!cover || cover.is_default || isDefaultLoading}
                    onClick={() => setAsDefault(region.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-purple-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDefaultLoading
                      ? "Mise à jour…"
                      : cover?.is_default
                        ? "Déjà par défaut"
                        : "Définir par défaut"}
                  </button>

                  <button
                    type="button"
                    disabled={!cover || isDeleting}
                    onClick={() => deleteCover(region.value)}
                    className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDeleting ? "Suppression…" : "Supprimer"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {message && (
        <p
          className={
            messageType === "success"
              ? "mt-5 rounded-xl border border-green-500/40 bg-green-950/40 px-4 py-3 text-sm text-green-200"
              : messageType === "error"
                ? "mt-5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
                : "mt-5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300"
          }
        >
          {message}
        </p>
      )}
    </section>
  );
}
