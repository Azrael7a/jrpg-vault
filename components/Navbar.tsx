import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold">
          JRPG Vault
        </Link>

        <div className="flex gap-4 text-sm">
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
        </div>
      </nav>
    </header>
  );
}
