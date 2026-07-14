import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/logout-button";
import NavbarGameSearch from "@/components/NavbarGameSearch";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-slate-100 backdrop-blur">
      <nav className="mx-auto flex max-w-[1500px] items-center gap-6 px-8 py-3">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight text-white"
        >
          JRPG Vault
        </Link>

        <div className="hidden w-[320px] shrink-0 lg:block">
          <NavbarGameSearch />
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-4 text-sm">
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

          {user ? (
            <>
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

      <div className="border-t border-slate-900 px-4 py-3 lg:hidden">
        <NavbarGameSearch />
      </div>
    </header>
  );
}
