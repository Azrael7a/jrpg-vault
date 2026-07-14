"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function FollowGameButton({
  gameId,
  initialIsFollowed,
}: {
  gameId: number;
  initialIsFollowed: boolean;
}) {
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleFollow() {
    const supabase = createClient();

    setIsLoading(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (isFollowed) {
      const { error } = await supabase
        .from("user_followed_games")
        .delete()
        .eq("user_id", user.id)
        .eq("game_id", gameId);

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsFollowed(false);
      setMessage("Jeu retiré des suivis.");
    } else {
      const { error } = await supabase.from("user_followed_games").insert({
        user_id: user.id,
        game_id: gameId,
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsFollowed(true);
      setMessage("Jeu ajouté aux suivis.");
    }

    setIsLoading(false);
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={isLoading}
        className={
          isFollowed
            ? "w-full rounded border border-purple-500 bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            : "w-full rounded border px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
        }
      >
        {isLoading
          ? "Chargement..."
          : isFollowed
            ? "★ Suivi"
            : "☆ Suivre ce jeu"}
      </button>

      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  );
}
