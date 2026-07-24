import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1500px] items-center justify-center px-8 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400">
            Inscription enregistrée
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Confirme ton adresse email
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Un message de confirmation vient de t’être envoyé. Ouvre le lien contenu
            dans cet email pour activer ton compte et accéder à ta collection.
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Pense à vérifier le dossier des courriers indésirables si tu ne vois pas
            le message après quelques minutes.
          </p>

          <div className="mt-6 border-t border-slate-800 pt-5">
            <Link
              href="/auth/login"
              className="text-sm text-purple-300 underline underline-offset-4"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
