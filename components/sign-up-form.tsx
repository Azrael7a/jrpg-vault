"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth/auth-error-message";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/collection`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        window.location.href = "/collection";
        return;
      }

      window.location.href = "/auth/sign-up-success";
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(
          error,
          "Impossible de créer le compte. Vérifie les informations saisies puis réessaie.",
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
          Inscription
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">Créer un compte</h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Crée ton compte pour enregistrer ta collection et suivre tes JRPG.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
            placeholder="ton@email.com"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Mot de passe</span>
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
            placeholder="Répète ton mot de passe"
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
          {isLoading ? "Création du compte..." : "Créer mon compte"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-800 pt-5 text-center text-sm text-slate-400">
        Tu as déjà un compte ?{" "}
        <Link
          href="/auth/login"
          className="text-purple-300 underline underline-offset-4"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
