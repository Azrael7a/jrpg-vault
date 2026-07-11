"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCollectionItemButton({
  itemId,
}: {
  itemId: number;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteItem() {
    console.log("DELETE démarré pour itemId :", itemId);

    setIsDeleting(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("Utilisateur courant :", { user, userError });

    if (userError) {
      setMessage(`Erreur utilisateur : ${userError.message}`);
      setIsDeleting(false);
      return;
    }

    if (!user) {
      setMessage("Tu dois être connecté pour supprimer un jeu.");
      setIsDeleting(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_collections")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select("id");

    console.log("Résultat suppression :", { data, error });

    if (error) {
      setMessage(`Erreur suppression : ${error.message}`);
      setIsDeleting(false);
      return;
    }

    if (!data || data.length === 0) {
      setMessage(
        "Aucune ligne supprimée. La ligne n'appartient peut-être pas à cet utilisateur ou la policy RLS bloque le DELETE."
      );
      setIsDeleting(false);
      return;
    }

    setMessage("Jeu supprimé.");
    router.refresh();

    setTimeout(() => {
      window.location.reload();
    }, 300);
  }

  return (
    <div className="mt-4">
      {!isConfirming ? (
        <button
          type="button"
          onClick={() => {
            console.log("Demande confirmation suppression itemId :", itemId);
            setIsConfirming(true);
            setMessage("Clique une seconde fois pour confirmer la suppression.");
          }}
          className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
        >
          Supprimer
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={deleteItem}
            disabled={isDeleting}
            className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {isDeleting ? "Suppression..." : "Confirmer suppression"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsConfirming(false);
              setMessage("");
            }}
            disabled={isDeleting}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
