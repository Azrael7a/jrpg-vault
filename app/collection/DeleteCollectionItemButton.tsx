"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCollectionItemButton({ itemId }: { itemId: number }) {
  const supabase = createClient();
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteItem() {
    const confirmDelete = window.confirm(
      "Supprimer ce jeu de ta collection ?"
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage("");

    const { error } = await supabase
      .from("user_collections")
      .delete()
      .eq("id", itemId);

    if (error) {
      setMessage(`Erreur : ${error.message}`);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={deleteItem}
        disabled={isDeleting}
        className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? "Suppression..." : "Supprimer"}
      </button>

      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
