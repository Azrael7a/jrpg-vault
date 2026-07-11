import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError) {
    console.error(
      "Erreur pendant la vérification administrateur :",
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
