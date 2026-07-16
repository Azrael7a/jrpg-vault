import type { Metadata } from "next";
import "./globals.css";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "JRPG Vault",
  description:
    "Gère ta collection JRPG, suis tes jeux à faire et découvre les prochaines sorties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Navbar />

        <div className="min-h-screen">{children}</div>

        <Footer />
      </body>
    </html>
  );
}
