"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = [
  { value: "owned", label: "Possédé" },
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "wishlist", label: "Wishlist" },
  { value: "preordered", label: "Précommandé" },
  { value: "abandoned", label: "Abandonné" },
];

export default function UpdateCollectionStatusSelect({
  itemId,
  currentStatus,
}: {
  itemId: number;
  currentStatus: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    setStatus(newStatus);
    setMessage("");
    setIsUpdating(true);

    const { error } = await supabase
      .from("user_collections")
      .update({ status: newStatus })
      .eq("id", itemId);

    if (error) {
      setMessage(`Erreur : ${error.message}`);
      setStatus(currentStatus);
      setIsUpdating(false);
      return;
    }

    setMessage("Statut mis à jour.");
    setIsUpdating(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <label className="grid gap-1">
        <span className="text-sm font-medium">Statut</span>

        <select
          value={status}
          onChange={(event) => updateStatus(event.target.value)}
          disabled={isUpdating}
          className="w-fit rounded border px-3 py-2"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
