"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/news/slugify";

function getRequiredField(
  formData: FormData,
  fieldName: string,
): string {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Le champ ${fieldName} est obligatoire.`);
  }

  return value.trim();
}

function getOptionalField(
  formData: FormData,
  fieldName: string,
): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function getStatus(formData: FormData): "draft" | "published" {
  return formData.get("status") === "published"
    ? "published"
    : "draft";
}

export async function createNews(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requireAdmin();

  const title = getRequiredField(formData, "title");
  const excerpt = getRequiredField(formData, "excerpt");
  const content = getRequiredField(formData, "content");

  const category = getOptionalField(formData, "category");
  const imageUrl = getOptionalField(formData, "imageUrl");
  const sourceName = getOptionalField(formData, "sourceName");
  const sourceUrl = getOptionalField(formData, "sourceUrl");
  const status = getStatus(formData);

  const baseSlug = slugify(title);

  if (!baseSlug) {
    throw new Error(
      "Impossible de générer l’adresse de l’actualité.",
    );
  }

  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data: existingNews, error: slugError } =
      await supabase
        .from("news")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (slugError) {
      throw new Error(
        `Impossible de vérifier le slug : ${slugError.message}`,
      );
    }

    if (!existingNews) {
      break;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const publishedAt =
    status === "published"
      ? new Date().toISOString()
      : null;

  const { error } = await supabase.from("news").insert({
    title,
    slug,

    // Ancienne colonne de ta table.
    summary: excerpt,

    // Nouvelle colonne utilisée par le formulaire.
    excerpt,

    content,
    category,
    image_url: imageUrl,
    source_name: sourceName,
    source_url: sourceUrl,
    status,
    published_at: publishedAt,
    author_id: user.id,
  });

  if (error) {
    throw new Error(
      `Impossible de créer l’actualité : ${error.message}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/news");

  redirect("/admin/news");
}

export async function updateNews(
  newsId: number,
  formData: FormData,
): Promise<void> {
  const { supabase } = await requireAdmin();

  if (!Number.isInteger(newsId) || newsId <= 0) {
    throw new Error("Identifiant d’actualité invalide.");
  }

  const title = getRequiredField(formData, "title");
  const excerpt = getRequiredField(formData, "excerpt");
  const content = getRequiredField(formData, "content");

  const category = getOptionalField(formData, "category");
  const imageUrl = getOptionalField(formData, "imageUrl");
  const sourceName = getOptionalField(formData, "sourceName");
  const sourceUrl = getOptionalField(formData, "sourceUrl");
  const status = getStatus(formData);

  const { data: existingNews, error: readError } =
    await supabase
      .from("news")
      .select("id, slug, published_at")
      .eq("id", newsId)
      .maybeSingle();

  if (readError) {
    throw new Error(
      `Impossible de lire l’actualité : ${readError.message}`,
    );
  }

  if (!existingNews) {
    throw new Error("Actualité introuvable.");
  }

  /*
   * La première publication reçoit la date actuelle.
   * Une actualité déjà publiée conserve sa date.
   * Un brouillon n'a pas de date de publication.
   */
  const publishedAt =
    status === "published"
      ? existingNews.published_at ??
        new Date().toISOString()
      : null;

  const { error: updateError } = await supabase
    .from("news")
    .update({
      title,
      summary: excerpt,
      excerpt,
      content,
      category,
      image_url: imageUrl,
      source_name: sourceName,
      source_url: sourceUrl,
      status,
      published_at: publishedAt,
    })
    .eq("id", newsId);

  if (updateError) {
    throw new Error(
      `Impossible de modifier l’actualité : ${updateError.message}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath(`/news/${existingNews.slug}`);
  revalidatePath("/admin/news");

  redirect("/admin/news");
}
