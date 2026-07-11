import Link from "next/link";
import { notFound } from "next/navigation";

import NewsForm from "@/components/admin/NewsForm";
import { requireAdmin } from "@/lib/auth/require-admin";

import { updateNews } from "../../actions";

type EditNewsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EditableNews = {
  id: number;
  title: string;
  excerpt: string | null;
  summary: string | null;
  content: string;
  category: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  status: "draft" | "published";
};

export default async function EditNewsPage({
  params,
}: EditNewsPageProps) {
  const { id } = await params;
  const newsId = Number(id);

  if (!Number.isInteger(newsId) || newsId <= 0) {
    notFound();
  }

  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      excerpt,
      summary,
      content,
      category,
      image_url,
      source_name,
      source_url,
      status
    `)
    .eq("id", newsId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Impossible de charger l’actualité : ${error.message}`,
    );
  }

  if (!data) {
    notFound();
  }

  const rawNews = data as EditableNews;

  const news = {
    title: rawNews.title,
    excerpt: rawNews.excerpt ?? rawNews.summary ?? "",
    content: rawNews.content,
    category: rawNews.category,
    image_url: rawNews.image_url,
    source_name: rawNews.source_name,
    source_url: rawNews.source_url,
    status: rawNews.status,
  };

  const updateAction = updateNews.bind(null, rawNews.id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin/news"
        className="text-sm font-medium text-violet-400 hover:text-violet-300"
      >
        ← Retour aux actualités
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">
          Modifier l’actualité
        </h1>

        <p className="mt-2 text-zinc-400">
          Corrige le contenu ou change son statut de publication.
        </p>
      </div>

      <div className="mt-8">
        <NewsForm
          action={updateAction}
          news={news}
        />
      </div>
    </main>
  );
}
