import Link from "next/link";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

type CollectionGame = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
};

type CollectionPlatform = {
  id: number;
  name: string;
};

type LatestItem = {
  id: number;
  status: CollectionStatus;
  game: CollectionGame | null;
  platform: CollectionPlatform | null;
} | null;

function getStatusLabel(status: CollectionStatus) {
  switch (status) {
    case "owned":
      return "Possédé";
    case "playing":
      return "En cours";
    case "completed":
      return "Terminé";
    case "backlog":
      return "Backlog";
    case "wishlist":
      return "Wishlist";
    case "preordered":
      return "Précommandé";
    case "abandoned":
      return "Abandonné";
  }
}

export default function HomeVaultSummary({
  isLoggedIn,
  total,
  stats,
  latestItem,
}: {
  isLoggedIn: boolean;
  total: number;
  stats: Record<CollectionStatus, number>;
  latestItem: LatestItem;
}) {
  if (!isLoggedIn) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
              Ma collection
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">Mon Vault</h2>

            <p className="mt-2 text-slate-300">
              Connecte-toi pour voir le résumé de ta collection JRPG.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
          >
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const statCards = [
    { label: "Total", value: total, accent: "text-white" },
    { label: "Terminés", value: stats.completed, accent: "text-green-400" },
    { label: "En cours", value: stats.playing, accent: "text-sky-400" },
    { label: "Backlog", value: stats.backlog, accent: "text-yellow-400" },
    { label: "Wishlist", value: stats.wishlist, accent: "text-purple-400" },
    {
      label: "Précommandés",
      value: stats.preordered,
      accent: "text-pink-400",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Ma collection
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <h2 className="mt-1 text-2xl font-bold text-white">Mon Vault</h2>

            <p className="pb-1 text-sm text-slate-400">
              Résumé de ta collection JRPG personnelle.
            </p>
          </div>
        </div>

        <Link href="/collection" className="text-sm text-purple-300 underline">
          Voir ma collection
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <p className={`text-3xl font-bold ${stat.accent}`}>
                {stat.value}
              </p>

              <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm font-semibold text-white">Dernier ajout</p>

          {latestItem?.game ? (
            <Link
              href={`/games/${latestItem.game.slug}`}
              className="mt-3 flex gap-3 hover:opacity-90"
            >
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-slate-800">
                {latestItem.game.cover_url ? (
                  <img
                    src={latestItem.game.cover_url}
                    alt={`Jaquette de ${latestItem.game.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                    JRPG
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="line-clamp-2 font-semibold text-white">
                  {latestItem.game.title}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {latestItem.platform?.name ?? "Plateforme inconnue"} ·{" "}
                  {getStatusLabel(latestItem.status)}
                </p>
              </div>
            </Link>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Aucun jeu ajouté pour le moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
