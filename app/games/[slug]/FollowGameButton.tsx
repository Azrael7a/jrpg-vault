"use client";

import { createClient } from "@/lib/supabase/client";
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
        setMessage("Impossible de retirer ce jeu des suivis.");
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
        setMessage("Impossible de suivre ce jeu pour le moment.");
        setIsLoading(false);
        return;
      }

      setIsFollowed(true);
      setMessage("Jeu ajouté aux suivis.");
    }

    setIsLoading(false);
  }

  return (
    <div className="grid content-start gap-2">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={isLoading}
        className={
          isFollowed
            ? "w-full rounded-xl border border-purple-400 bg-purple-500/15 px-5 py-3 text-sm font-bold text-purple-100 transition hover:bg-purple-500/25 disabled:opacity-50"
            : "w-full rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-purple-400 hover:text-purple-100 disabled:opacity-50"
        }
      >
        {isLoading
          ? "Mise à jour…"
          : isFollowed
            ? "★ Jeu suivi"
            : "☆ Suivre ce jeu"}
      </button>

      {message && (
        <p aria-live="polite" className="text-xs text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}
