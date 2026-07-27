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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            Suivi
          </p>

          <h2 className="mt-1 text-base font-bold text-white">
            {isFollowed ? "Jeu suivi" : "Suivre ce jeu"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {isFollowed
              ? "Tu suis les actualités et sorties liées à ce jeu."
              : "Ajoute ce jeu à tes suivis pour le retrouver plus vite."}
          </p>
        </div>

        <span
          className={
            isFollowed
              ? "rounded-full border border-purple-500/40 bg-purple-950/70 px-3 py-1 text-xs font-semibold text-purple-200"
              : "rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300"
          }
        >
          {isFollowed ? "★ Suivi" : "☆ Libre"}
        </span>
      </div>

      <button
        type="button"
        onClick={toggleFollow}
        disabled={isLoading}
        className={
          isFollowed
            ? "mt-4 w-full rounded-xl border border-purple-500 bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            : "mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-purple-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {isLoading
          ? "Mise à jour..."
          : isFollowed
            ? "Ne plus suivre"
            : "☆ Suivre ce jeu"}
      </button>

      {message && (
        <p className="mt-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400">
          {message}
        </p>
      )}
    </section>
  );
}
