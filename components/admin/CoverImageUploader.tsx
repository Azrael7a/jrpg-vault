"use client";

import { useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "game-covers";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  helperText?: string;
  folder: string;
  previewAlt: string;
  onUploadingChange?: (isUploading: boolean) => void;
};

function sanitizeFolder(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

export default function CoverImageUploader({
  value,
  onChange,
  label,
  helperText,
  folder,
  previewAlt,
  onUploadingChange,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");

    const extension = allowedTypes.get(file.type);

    if (!extension) {
      setError("Choisis une image JPEG, PNG ou WebP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("L’image ne doit pas dépasser 5 Mo.");
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Ta session a expiré. Reconnecte-toi avant d’envoyer l’image.");
        return;
      }

      const cleanFolder = sanitizeFolder(folder) || "misc";
      const objectPath = `${user.id}/${cleanFolder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(objectPath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(`Impossible d’envoyer l’image : ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(objectPath);

      if (!data.publicUrl) {
        setError("L’image a été envoyée, mais son adresse publique est introuvable.");
        return;
      }

      onChange(data.publicUrl);
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadFile(file);
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="jrpg-button-secondary px-4 py-2 disabled:cursor-wait disabled:opacity-60"
        >
          {isUploading
            ? "Envoi en cours…"
            : value
              ? "Remplacer l’image"
              : "Choisir une image"}
        </button>

        {value && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => onChange("")}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-red-300 disabled:opacity-50"
          >
            Retirer la jaquette
          </button>
        )}
      </div>

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}

      {error && (
        <p aria-live="polite" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {value && (
        <div className="mt-1 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <img
            src={value}
            alt={previewAlt}
            className="h-32 w-24 rounded-lg object-cover"
          />
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-200">Image enregistrée</p>
            <p className="mt-1">
              Elle est hébergée dans Supabase Storage et ne dépend plus d’un site
              externe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
