import Link from "next/link";

function getErrorContent(reason: string | undefined) {
  if (reason === "confirmation_invalid") {
    return {
      title: "Lien de confirmation invalide",
      description:
        "Ce lien a expiré ou a déjà été utilisé. Recommence l’inscription ou demande un nouveau lien depuis la connexion.",
    };
  }

  return {
    title: "Une erreur est survenue",
    description:
      "L’opération n’a pas pu être terminée. Retourne à la connexion puis réessaie.",
  };
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const content = getErrorContent(params.reason);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1500px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-md rounded-2xl border border-red-900/70 bg-slate-900/70 p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-400">
            Authentification
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">{content.title}</h1>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            {content.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-sm">
            <Link
              href="/auth/login"
              className="text-purple-300 underline underline-offset-4"
            >
              Retour à la connexion
            </Link>

            <Link
              href="/auth/sign-up"
              className="text-slate-300 underline underline-offset-4"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
