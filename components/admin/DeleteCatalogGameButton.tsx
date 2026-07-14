"use client";

import { deleteCatalogGame } from "@/app/admin/games/actions";

export default function DeleteCatalogGameButton({
  gameId,
  title,
}: {
  gameId: number;
  title: string;
}) {
  const action = deleteCatalogGame.bind(null, gameId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Supprimer définitivement « ${title} » du catalogue ?`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
      >
        Supprimer
      </button>
    </form>
  );
}
