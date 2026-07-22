"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PlateRow, PlateStatus } from "@/types/database";

const STATUS_BADGE: Record<PlateStatus, { label: string; className: string }> = {
  pending: {
    label: "En attente de validation",
    className: "bg-amber-500/15 text-amber-400",
  },
  approved: {
    label: "Plaque validée · +50 pts",
    className: "bg-emerald-500/15 text-emerald-400",
  },
  rejected: {
    label: "Photo refusée · reprends une photo",
    className: "bg-red-500/15 text-red-400",
  },
};

export default function PhotoUpload({
  stateCode,
  userId,
  plate,
  photoUrl,
}: {
  stateCode: string;
  userId: string;
  plate: PlateRow | null;
  photoUrl: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const canUpload = !plate || plate.status === "rejected";

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setLocalPreview(URL.createObjectURL(file));

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${stateCode}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("plates")
        .upload(path, file, { upsert: true, cacheControl: "0" });

      if (uploadError) throw uploadError;

      if (plate) {
        const { error: updateError } = await supabase
          .from("plates")
          .update({
            photo_path: path,
            status: "pending",
            reviewed_at: null,
            reviewed_by: null,
          })
          .eq("id", plate.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("plates").insert({
          user_id: userId,
          state_code: stateCode,
          photo_path: path,
          status: "pending",
        });
        if (insertError) throw insertError;
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de l'envoi de la photo."
      );
    } finally {
      setUploading(false);
    }
  }

  const badge = plate ? STATUS_BADGE[plate.status] : null;
  const displayUrl = localPreview ?? photoUrl;

  return (
    <div className="flex flex-col gap-3">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={`Plaque de ${stateCode}`}
          className="aspect-video w-full rounded-xl border border-slate-800 object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-sm text-slate-500">
          Aucune photo pour l&apos;instant
        </div>
      )}

      {badge && (
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
      )}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {uploading
              ? "Envoi en cours..."
              : plate?.status === "rejected"
                ? "Reprendre une photo"
                : "📸 Prendre / envoyer la plaque"}
          </button>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
