import Link from "next/link";

import NewsForm from "@/components/admin/NewsForm";
import { requireAdmin } from "@/lib/auth/require-admin";

import { createNews } from "../actions";

export default async function NewNewsPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin/news"
        className="text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ← Retour aux actualités
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">
          Ajouter une actualité
        </h1>

        <p className="mt-2 text-zinc-400">
          Enregistre un brouillon ou publie directement une
          actualité.
        </p>
      </div>

      <div className="mt-8">
        <NewsForm action={createNews} />
      </div>
    </main>
  );
}
