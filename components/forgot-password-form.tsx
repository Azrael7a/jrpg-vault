"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth/auth-error-message";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(
          error,
          "Impossible d’envoyer le message de réinitialisation. Réessaie dans quelques instants.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
          Email envoyé
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">Vérifie ta messagerie</h1>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          Si un compte correspond à cette adresse, tu recevras un lien permettant de
          choisir un nouveau mot de passe.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Vérifie également le dossier des courriers indésirables.
        </p>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <Link
            href="/auth/login"
            className="text-sm text-purple-300 underline underline-offset-4"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
          Mot de passe oublié
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Réinitialiser le mot de passe
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Indique ton adresse email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="mt-8 grid gap-5">
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
          {isLoading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-800 pt-5 text-center text-sm text-slate-400">
        Tu connais ton mot de passe ?{" "}
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
