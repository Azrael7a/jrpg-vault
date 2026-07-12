import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          JRPG Vault
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/games" className="hover:underline">
            Catalogue
          </Link>

          <Link href="/collection" className="hover:underline">
            Ma collection
          </Link>

          <Link href="/releases" className="hover:underline">
            Sorties
          </Link>

          <Link href="/news" className="hover:underline">
            Actualités
          </Link>

          <Link href="/about" className="hover:underline">
            À propos
          </Link>

          {user ? (
            <LogoutButton />
          ) : (
            <Link href="/auth/login" className="rounded border px-3 py-1 hover:bg-gray-100">
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
