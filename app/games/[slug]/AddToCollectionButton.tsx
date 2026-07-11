"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

type Platform = {
  id: number;
  name: string;
};

const statuses = [
  { value: "owned", label: "Possédé" },
  { value: "backlog", label: "À faire" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "wishlist", label: "Wishlist" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
] as const;

const formats = [
  { value: "physical", label: "Physique" },
  { value: "digital", label: "Numérique" },
  { value: "both", label: "Les deux" },
] as const;

const regions = [
  { value: "PAL", label: "PAL" },
  { value: "US", label: "US" },
  { value: "JAP", label: "JAP" },
  { value: "ASIA", label: "ASIA" },
  { value: "WORLD", label: "WORLD" },
] as const;

export default function AddToCollectionButton({ gameId }: { gameId: number }) {
  const supabase = createClient();

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformId, setPlatformId] = useState("");
  const [format, setFormat] = useState("physical");
  const [region, setRegion] = useState("PAL");
  const [status, setStatus] = useState("owned");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadPlatforms() {
      const { data, error } = await supabase
        .from("platforms")
        .select("id, name")
        .order("id");

      if (error) {
        setMessage(`Erreur plateformes : ${error.message}`);
        return;
      }

      setPlatforms(data ?? []);

      if (data && data.length > 0) {
        setPlatformId(String(data[0].id));
      }
    }

    loadPlatforms();
  }, [supabase]);

  async function addToCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("Connecte-toi pour ajouter ce jeu.");
      setIsLoading(false);
      return;
    }

    if (!platformId) {
      setMessage("Choisis une plateforme.");
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
          "Ce jeu existe déjà dans ta collection avec cette plateforme, région et format."
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

  return (
    <form onSubmit={addToCollection} className="jrpg-card p-4">
      <h2 className="text-xl font-semibold">Ajouter à ma collection</h2>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-200">Plateforme</span>
          <select
            value={platformId}
            onChange={(event) => setPlatformId(event.target.value)}
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
            onChange={(event) => setRegion(event.target.value)}
            className="rounded border px-3 py-2"
          >
            {regions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
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
        disabled={isLoading || platforms.length === 0}
        className="jrpg-button-primary mt-4 px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? "Ajout..." : "Ajouter à ma collection"}
      </button>

      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </form>
  );
}
