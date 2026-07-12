import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-gray-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-8 py-8 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-gray-900">JRPG Vault</p>
          <p className="mt-1">
            Catalogue JRPG · Collection · Backlog · Sorties
          </p>
        </div>

        <nav className="flex flex-wrap gap-4">
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
        </nav>
      </div>
    </footer>
  );
}
