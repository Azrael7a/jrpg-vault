import { createClient } from "@/lib/supabase/server";

export type PublicNewsCard = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  excerpt: string | null;
  image_url: string | null;
  category: string | null;
  published_at: string;
};

export type PublicNewsArticle = PublicNewsCard & {
  content: string;
  source_name: string | null;
  source_url: string | null;
};

export async function getPublishedNews(
  limit?: number,
): Promise<PublicNewsCard[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      summary,
      excerpt,
      image_url,
      category,
      published_at
    `)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("published_at", {
      ascending: false,
    });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Impossible de charger les actualités publiques : ${error.message}`,
    );
  }

  return (data ?? []) as PublicNewsCard[];
}

export async function getPublishedNewsBySlug(
  slug: string,
): Promise<PublicNewsArticle | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("news")
    .select(`
      id,
      title,
      slug,
      summary,
      excerpt,
      content,
      image_url,
      category,
      source_name,
      source_url,
      published_at
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Impossible de charger l’actualité : ${error.message}`,
    );
  }

  return data
    ? (data as PublicNewsArticle)
    : null;
}
