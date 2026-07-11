type EditableNews = {
  title: string;
  excerpt: string;
  content: string;
  category: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  status: "draft" | "published";
};

type NewsFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  news?: EditableNews;
};

export default function NewsForm({
  action,
  news,
}: NewsFormProps) {
  const isEditing = Boolean(news);

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
    >
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-semibold"
        >
          Titre
        </label>

        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={180}
          defaultValue={news?.title ?? ""}
          placeholder="Exemple : Un nouveau trailer pour Persona"
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="mb-2 block text-sm font-semibold"
        >
          Résumé
        </label>

        <textarea
          id="excerpt"
          name="excerpt"
          required
          maxLength={600}
          rows={4}
          defaultValue={news?.excerpt ?? ""}
          placeholder="Résumé affiché dans la liste des actualités."
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-semibold"
        >
          Contenu complet
        </label>

        <textarea
          id="content"
          name="content"
          required
          rows={16}
          defaultValue={news?.content ?? ""}
          placeholder="Contenu complet de l’actualité."
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 leading-7 text-white outline-none focus:border-violet-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-semibold"
          >
            Catégorie
          </label>

          <select
            id="category"
            name="category"
            defaultValue={news?.category ?? "Actualité"}
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
          >
            <option value="Actualité">Actualité</option>
            <option value="Annonce">Annonce</option>
            <option value="Sortie">Sortie</option>
            <option value="Trailer">Trailer</option>
            <option value="Mise à jour">
              Mise à jour
            </option>
            <option value="Événement">Événement</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold"
          >
            Statut
          </label>

          <select
            id="status"
            name="status"
            defaultValue={news?.status ?? "draft"}
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-4 py-3 text-white"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="imageUrl"
          className="mb-2 block text-sm font-semibold"
        >
          Adresse de l’image
        </label>

        <input
          id="imageUrl"
          name="imageUrl"
          type="text"
          defaultValue={news?.image_url ?? ""}
          placeholder="/images/news/image.jpg ou https://..."
          className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="sourceName"
            className="mb-2 block text-sm font-semibold"
          >
            Nom de la source
          </label>

          <input
            id="sourceName"
            name="sourceName"
            type="text"
            defaultValue={news?.source_name ?? ""}
            placeholder="Square Enix, Gematsu..."
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor="sourceUrl"
            className="mb-2 block text-sm font-semibold"
          >
            Lien de la source
          </label>

          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            defaultValue={news?.source_url ?? ""}
            placeholder="https://..."
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-500"
        >
          {isEditing
            ? "Enregistrer les modifications"
            : "Créer l’actualité"}
        </button>
      </div>
    </form>
  );
}

