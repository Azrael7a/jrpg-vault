"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function getPublishedAt(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  return new Date(text).toISOString();
}

function getRelatedGameId(value: FormDataEntryValue | null) {
  const relatedGameIdValue = String(value ?? "").trim();

  if (!relatedGameIdValue) {
    return null;
  }

  const relatedGameId = Number(relatedGameIdValue);

  if (!Number.isFinite(relatedGameId)) {
    return null;
  }

  return relatedGameId;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return supabase;
}

function revalidateNewsPages() {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin/news");
}

export async function createNews(formData: FormData) {
  const supabase = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();

  const slug = slugInput || generateSlug(title);

  const summary = String(formData.get("summary") ?? "").trim();
  const excerpt = cleanOptionalText(formData.get("excerpt"));
  const content = cleanOptionalText(formData.get("content"));
  const image_url = cleanOptionalText(formData.get("image_url"));
  const source_url = cleanOptionalText(formData.get("source_url"));
  const category = cleanOptionalText(formData.get("category"));
  const status = String(formData.get("status") ?? "draft");
  const published_at = getPublishedAt(formData.get("published_at"));
  const related_game_id = getRelatedGameId(formData.get("related_game_id"));

  if (!title) {
    throw new Error("Le titre est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug est obligatoire.");
  }

  if (!summary) {
    throw new Error("Le résumé est obligatoire.");
  }

  const payload = {
    title,
    slug,
    summary,
    excerpt,
    content,
    image_url,
    source_url,
    category,
    status,
    published_at,
    related_game_id,
  };

  const { error } = await supabase.from("news").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidateNewsPages();
  redirect("/admin/news");
}

export async function updateNews(formData: FormData) {
  const supabase = await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Actualité invalide.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const excerpt = cleanOptionalText(formData.get("excerpt"));
  const content = cleanOptionalText(formData.get("content"));
  const image_url = cleanOptionalText(formData.get("image_url"));
  const source_url = cleanOptionalText(formData.get("source_url"));
  const category = cleanOptionalText(formData.get("category"));
  const status = String(formData.get("status") ?? "draft");
  const published_at = getPublishedAt(formData.get("published_at"));
  const related_game_id = getRelatedGameId(formData.get("related_game_id"));

  if (!title) {
    throw new Error("Le titre est obligatoire.");
  }

  if (!slug) {
    throw new Error("Le slug est obligatoire.");
  }

  if (!summary) {
    throw new Error("Le résumé est obligatoire.");
  }

  const payload = {
    title,
    slug,
    summary,
    excerpt,
    content,
    image_url,
    source_url,
    category,
    status,
    published_at,
    related_game_id,
  };

  const { error } = await supabase.from("news").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateNewsPages();
  revalidatePath(`/news/${slug}`);
  redirect("/admin/news");
}

export async function deleteNews(formData: FormData) {
  const supabase = await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Actualité invalide.");
  }

  const { error } = await supabase.from("news").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateNewsPages();
  redirect("/admin/news");
}
