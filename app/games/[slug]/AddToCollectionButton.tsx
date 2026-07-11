"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function AddToCollectionButton({ gameId }: { gameId: number }) {
  const [message, setMessage] = useState("");

  async function addToCollection() {
    const supabase = createClient();

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("Connecte-toi pour ajouter ce jeu.");
      return;
    }

    const { data: platform, error: platformError } = await supabase
      .from("platforms")
      .select("id")
      .eq("name", "PS4")
      .single();

    if (platformError || !platform) {
      setMessage("Plateforme PS4 introuvable dans Supabase.");
      return;
    }

    const { error } = await supabase.from("user_collections").insert({
      user_id: userData.user.id,
      game_id: gameId,
      platform_id: platform.id,
      status: "owned",
      format: "physical",
      region: "PAL",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Jeu ajouté à ta collection.");
  }

  return (
    <div>
      <button
        onClick={addToCollection}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Ajouter à ma collection
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
