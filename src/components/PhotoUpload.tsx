"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PlateRow, PlateStatus } from "@/types/database";

function getStatusBadge(
  status: PlateStatus,
  platePoints: number
): { label: string; className: string } {
  switch (status) {
    case "pending":
      return {
        label: "En attente de validation",
        className: "bg-amber-500/15 text-amber-400",
      };
    case "approved":
      return {
        label: `Plaque validée · +${platePoints} pts`,
        className: "bg-emerald-500/15 text-emerald-400",
      };
    case "rejected":
      return {
        label: "Photo refusée · reprends une photo",
        className: "bg-red-500/15 text-red-400",
      };
  }
}

export default function PhotoUpload({
  stateCode,
  userId,
  plate,
  photoUrl,
  platePoints,
}: {
  stateCode: string;
  userId: string;
  plate: PlateRow | null;
  photoUrl: string | null;
  platePoints: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const isApproved = plate?.status === "approved";
  const canEdit = !plate || !isApproved;

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

  async function handleDelete() {
    if (!plate) return;
    if (!window.confirm("Supprimer cette photo ? Tu devras en reprendre une nouvelle."))
      return;

    setError(null);
    setDeleting(true);
    try {
      await supabase.storage.from("plates").remove([plate.photo_path]);
      const { error: deleteError } = await supabase
        .from("plates")
        .delete()
        .eq("id", plate.id);
      if (deleteError) throw deleteError;

      setLocalPreview(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de la suppression."
      );
    } finally {
      setDeleting(false);
    }
  }

  const badge = plate ? getStatusBadge(plate.status, platePoints) : null;
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

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading || deleting}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
          >
            {uploading
              ? "Envoi en cours..."
              : plate
                ? "🔄 Remplacer la photo"
                : "📸 Prendre / envoyer la plaque"}
          </button>
          {plate && (
            <button
              type="button"
              disabled={uploading || deleting}
              onClick={handleDelete}
              className="rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
            >
              {deleting ? "Suppression..." : "🗑️ Supprimer"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
