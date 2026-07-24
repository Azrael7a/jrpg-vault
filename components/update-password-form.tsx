"use client";

import { FormEvent, useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth/auth-error-message";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      window.location.href = "/collection";
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(
          error,
          "Impossible de modifier le mot de passe. Demande un nouveau lien et réessaie.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
          Sécurité du compte
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Choisir un nouveau mot de passe
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Utilise un mot de passe d’au moins 8 caractères que tu n’emploies pas sur
          un autre site.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">
            Nouveau mot de passe
          </span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
            placeholder="8 caractères minimum"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">
            Confirmer le mot de passe
          </span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
            placeholder="Répète le nouveau mot de passe"
          />
        </label>

        {errorMessage && (
          <div className="rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
