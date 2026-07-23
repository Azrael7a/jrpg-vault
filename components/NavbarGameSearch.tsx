"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type GameSearchResult = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  release_year: number | null;
};

export default function NavbarGameSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 2) {
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("games")
        .select("id, title, slug, cover_url, release_year")
        .ilike("title", `%${cleanQuery}%`)
        .order("title", { ascending: true })
        .limit(6);

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Erreur recherche jeux :", error);
        setResults([]);
      } else {
        setResults((data ?? []) as GameSearchResult[]);
      }

      setIsOpen(true);
      setIsLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setIsOpen(true);
          }
        }}
        placeholder="Rechercher un jeu..."
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-purple-500"
      />

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
          {isLoading && (
            <div className="p-4 text-sm text-slate-400">Recherche...</div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-4 text-sm text-slate-400">
              Aucun jeu trouvé.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="divide-y divide-slate-800">
              {results.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setIsOpen(false);
                  }}
                  className="flex gap-3 p-3 hover:bg-slate-900"
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-800">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={`Jaquette de ${game.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                        JRPG
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium text-white">
                      {game.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {game.release_year ?? "Année inconnue"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="border-t border-slate-800 p-3">
            <Link
              href="/games"
              onClick={() => setIsOpen(false)}
              className="text-xs text-purple-300 underline underline-offset-4"
            >
              Voir tout le catalogue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
