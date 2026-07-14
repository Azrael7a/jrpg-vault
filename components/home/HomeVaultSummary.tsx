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
};

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
  latestItems = [],
}: {
  isLoggedIn: boolean;
  total: number;
  stats: Record<CollectionStatus, number>;
  latestItems?: LatestItem[];
}) {
  if (!isLoggedIn) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
              Ma collection
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">Mon Vault</h2>

            <p className="mt-2 text-sm text-slate-400">
              Connecte-toi pour voir le résumé de ta collection JRPG.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="rounded border border-purple-500 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-950"
          >
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const statItems = [
    { label: "Total", value: total },
    { label: "Terminés", value: stats.completed },
    { label: "En cours", value: stats.playing },
    { label: "Backlog", value: stats.backlog },
    { label: "Wishlist", value: stats.wishlist },
    { label: "Précommandés", value: stats.preordered },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-xl">
      <div className="grid gap-8 xl:grid-cols-[1fr_520px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                Ma collection
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">Mon Vault</h2>
            </div>

            <p className="pb-1 text-sm text-slate-400">
              Résumé de ta collection JRPG personnelle.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
            {statItems.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {stat.value}
                </span>

                <span className="text-sm text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/collection"
              className="text-sm text-purple-300 underline underline-offset-4"
            >
              Voir ma collection
            </Link>
          </div>
        </div>

        <div className="border-slate-800 xl:border-l xl:pl-6">
          <div>
            <p className="text-sm font-semibold text-white">Derniers ajouts</p>

            <p className="mt-1 text-xs text-slate-500">
              Les derniers jeux ajoutés à ton Vault.
            </p>
          </div>

          {latestItems.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {latestItems.map((item) => {
                if (!item.game) {
                  return null;
                }

                return (
                  <Link
                    key={item.id}
                    href={`/games/${item.game.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-purple-500"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-800">
                      {item.game.cover_url ? (
                        <img
                          src={item.game.cover_url}
                          alt={`Jaquette de ${item.game.title}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          JRPG
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="line-clamp-1 font-semibold text-white">
                        {item.game.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {item.platform?.name ?? "Plateforme inconnue"} ·{" "}
                        {getStatusLabel(item.status)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
              Aucun jeu ajouté pour le moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
