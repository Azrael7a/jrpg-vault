"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/auth/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
    >
      Se déconnecter
    </button>
  );
}
