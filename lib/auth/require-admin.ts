import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log("Aucun utilisateur connecté");
    redirect("/login");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  console.log("Utilisateur connecté :", user.email);
  console.log("Résultat is_admin :", isAdmin);

  if (adminError) {
    console.error(
      "Erreur de vérification administrateur :",
      adminError,
    );

    redirect("/");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return {
    supabase,
    user,
  };
}
