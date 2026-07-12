import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center px-8 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Erreur 404
      </p>

      <h1 className="mt-3 text-4xl font-bold">Page introuvable</h1>

      <p className="mt-4 max-w-xl text-gray-600">
        Cette page n’existe pas dans JRPG Vault, ou le contenu demandé a été
        déplacé.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Retour à l’accueil
        </Link>

        <Link
          href="/games"
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Voir le catalogue
        </Link>
      </div>
    </main>
  );
}
