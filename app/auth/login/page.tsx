"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Email ou mot de passe incorrect.");
      setIsLoading(false);
      return;
    }

    window.location.href = "/collection";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1500px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Connexion
            </p>

            <h1 className="mt-1 text-3xl font-bold text-white">
              Se connecter
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Connecte-toi pour gérer ta collection JRPG.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Email
              </span>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                placeholder="ton@email.com"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-300">
                Mot de passe
              </span>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-purple-500"
                placeholder="••••••••"
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
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-sm text-slate-400">
            <p>
              Les pages publiques comme le catalogue, les sorties et les
              actualités restent accessibles sans compte.
            </p>

            <Link
              href="/"
              className="mt-3 inline-block text-purple-300 underline underline-offset-4"
            >
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
