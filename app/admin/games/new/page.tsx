import Link from "next/link";
import CatalogGameForm from "@/components/admin/CatalogGameForm";
import { createCatalogGame } from "../actions";
import { requireAdmin } from "@/lib/admin/requireAdmin";

type Platform = {
  id: number;
  name: string;
  is_legacy: boolean;
  display_order: number;
};

export default async function NewCatalogGamePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("platforms")
    .select("id, name, is_legacy, display_order")
    .order("is_legacy")
    .order("display_order")
    .order("name");

  const platforms = (data ?? []) as Platform[];
  const errorMessage =
    typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto w-full max-w-6xl p-8">
      <Link href="/admin/games" className="text-sm text-violet-300 underline">
        ← Retour au catalogue administratif
      </Link>

      <div className="mt-6">
        <p className="jrpg-badge">Administration</p>
        <h1 className="mt-4 text-4xl font-bold">Ajouter un jeu au catalogue</h1>
        <p className="mt-3 text-slate-400">
          Utilise cette page pour les jeux déjà sortis, comme les JRPG
          PlayStation. Ils ne seront pas ajoutés au calendrier des sorties.
        </p>
      </div>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {errorMessage}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          Impossible de charger les plateformes : {error.message}
        </p>
      )}

      <CatalogGameForm
        action={createCatalogGame}
        platforms={platforms}
        submitLabel="Ajouter au catalogue"
      />
    </main>
  );
}
