import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-8 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          JRPG Vault
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-4 text-sm">
          <Link href="/games" className="text-slate-300 hover:text-white">
            Catalogue
          </Link>

          <Link href="/collection" className="text-slate-300 hover:text-white">
            Ma collection
          </Link>

          <Link href="/releases" className="text-slate-300 hover:text-white">
            Sorties
          </Link>

          <Link href="/news" className="text-slate-300 hover:text-white">
            Actualités
          </Link>

          <Link href="/about" className="text-slate-300 hover:text-white">
            À propos
          </Link>

          {user ? (
            <>
              <Link href="/followed" className="text-slate-300 hover:text-white">
                Suivis
              </Link>

              <Link href="/account" className="text-slate-300 hover:text-white">
                Compte
              </Link>

              <LogoutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-purple-500 hover:text-white"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
