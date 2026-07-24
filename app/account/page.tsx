import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionItem = {
  id: number;
  status: CollectionStatus;
};

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("user_collections")
    .select("id, status")
    .eq("user_id", user.id);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Mon compte</h1>
        <p className="mt-4 text-red-600">Erreur : {error.message}</p>
      </main>
    );
  }

  const items = (data ?? []) as CollectionItem[];

  const stats: Record<CollectionStatus, number> = {
    owned: 0,
    playing: 0,
    completed: 0,
    backlog: 0,
    wishlist: 0,
    preordered: 0,
    abandoned: 0,
  };

  for (const item of items) {
    stats[item.status] += 1;
  }

  const total = items.length;
  const completionRate =
    total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR")
    : "Date inconnue";

  return (
    <main className="mx-auto max-w-5xl p-8">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Espace utilisateur
          </p>

          <h1 className="mt-3 text-4xl font-bold">Mon compte</h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Retrouve les informations de ton compte et un résumé de ta
            collection JRPG.
          </p>
        </div>

        <LogoutButton />
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="rounded-xl border bg-gray-50 p-5">
          <h2 className="text-xl font-semibold">Informations</h2>

          <div className="mt-4 grid gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-500">Adresse e-mail</p>
              <p className="mt-1 break-all">{user.email}</p>
            </div>

            <div>
              <p className="font-medium text-gray-500">Compte créé le</p>
              <p className="mt-1">{createdAt}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="text-xl font-semibold">Résumé de collection</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-600">Terminés</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold">{stats.playing}</p>
              <p className="text-sm text-gray-600">En cours</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-2xl font-bold">{completionRate}%</p>
              <p className="text-sm text-gray-600">Progression</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full border px-3 py-1">
              Backlog : {stats.backlog}
            </span>

            <span className="rounded-full border px-3 py-1">
              Wishlist : {stats.wishlist}
            </span>

            <span className="rounded-full border px-3 py-1">
              Précommandés : {stats.preordered}
            </span>

            <span className="rounded-full border px-3 py-1">
              Abandonnés : {stats.abandoned}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/collection"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Voir ma collection
        </Link>

        <Link
          href="/games"
          className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Explorer le catalogue
        </Link>
      </section>
    </main>
  );
}
