import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos — JRPG Vault",
  description:
    "JRPG Vault est un outil pour gérer sa collection JRPG, son backlog, sa wishlist et les sorties à venir.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          À propos
        </p>

        <h1 className="mt-3 text-4xl font-bold">JRPG Vault</h1>

        <p className="mt-5 leading-7 text-gray-700">
          JRPG Vault est un outil de suivi pour les joueurs et collectionneurs
          de JRPG. Le site permet de consulter un catalogue, d’ajouter des jeux
          à sa collection, de suivre son backlog, ses jeux terminés, sa wishlist
          et les sorties à venir.
        </p>

        <p className="mt-4 leading-7 text-gray-700">
          L’objectif de cette première version est simple : proposer une base
          claire et pratique pour organiser sa collection JRPG, notamment sur
          consoles PlayStation, Nintendo Switch et PC.
        </p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-gray-50 p-5">
          <h2 className="font-semibold">Catalogue</h2>
          <p className="mt-2 text-sm text-gray-600">
            Retrouver les jeux, leurs séries, plateformes, éditions et sorties.
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-5">
          <h2 className="font-semibold">Collection</h2>
          <p className="mt-2 text-sm text-gray-600">
            Classer ses jeux par statut : possédé, en cours, terminé, backlog ou
            wishlist.
          </p>
        </div>

        <div className="rounded-xl border bg-gray-50 p-5">
          <h2 className="font-semibold">Sorties</h2>
          <p className="mt-2 text-sm text-gray-600">
            Suivre les sorties JRPG à venir, les plateformes et les formats.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/games"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Explorer le catalogue
        </Link>

        <Link
          href="/collection"
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Voir ma collection
        </Link>
      </div>
    </main>
  );
}
