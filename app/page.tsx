import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="rounded-2xl border p-8">
        <h1 className="text-4xl font-bold">JRPG Vault</h1>

        <p className="mt-4 text-lg text-gray-600">
          Gère ta collection JRPG, suis ton backlog et surveille les prochaines sorties.
        </p>

        <div className="mt-6 flex gap-4">
          <Link href="/games" className="rounded bg-black px-4 py-2 text-white">
            Voir le catalogue
          </Link>

          <Link href="/collection" className="rounded border px-4 py-2">
            Ma collection
          </Link>

          <Link href="/releases" className="rounded border px-4 py-2">
            Prochaines sorties
          </Link>

          <Link href="/news" className="rounded border px-4 py-2">
            Actualités
          </Link>
        </div>
      </section>
    </main>
  );
}
