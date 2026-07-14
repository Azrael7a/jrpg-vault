import Link from "next/link";

type CollectionStatus =
  | "owned"
  | "playing"
  | "completed"
  | "backlog"
  | "wishlist"
  | "preordered"
  | "abandoned";

export default function HomeVaultSummary({
  isLoggedIn,
  total,
  stats,
}: {
  isLoggedIn: boolean;
  total: number;
  stats: Record<CollectionStatus, number>;
  latestItems?: unknown;
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
              Connecte-toi pour gérer ta bibliothèque JRPG personnelle.
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

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-xl">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
            Ma collection
          </p>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <h2 className="text-2xl font-bold text-white">Mon Vault</h2>

            <p className="pb-1 text-sm text-slate-400">
              Ta bibliothèque JRPG personnelle.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 lg:justify-center">
          <span>
            <strong className="text-lg text-white">{total}</strong> jeux
          </span>

          <span>
            <strong className="text-lg text-white">{stats.playing}</strong> en cours
          </span>

          <span>
            <strong className="text-lg text-white">{stats.backlog}</strong> backlog
          </span>

          <span>
            <strong className="text-lg text-white">{stats.wishlist}</strong> wishlist
          </span>

          <span>
            <strong className="text-lg text-white">{stats.preordered}</strong>{" "}
            précommandés
          </span>
        </div>

        <Link
          href="/collection"
          className="shrink-0 text-sm text-purple-300 underline underline-offset-4"
        >
          Voir ma collection
        </Link>
      </div>
    </section>
  );
}
