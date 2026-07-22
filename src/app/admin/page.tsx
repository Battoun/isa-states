import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { reviewPlate } from "@/app/admin/actions";

interface AdminPlate {
  id: string;
  photo_path: string;
  created_at: string;
  reviewed_at: string | null;
  status: "pending" | "approved" | "rejected";
  profiles: { username: string } | null;
  states: { name: string; code: string } | null;
}

const HISTORY_BADGE: Record<"approved" | "rejected", string> = {
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

const HISTORY_LABEL: Record<"approved" | "rejected", string> = {
  approved: "Validée",
  rejected: "Refusée",
};

export default async function AdminPage() {
  const { supabase, profile } = await requireUser();

  if (!profile.is_admin) {
    redirect("/dashboard");
  }

  const [pendingRes, historyRes] = await Promise.all([
    supabase
      .from("plates")
      .select(
        "id, photo_path, created_at, reviewed_at, status, profiles!plates_user_id_fkey(username), states(name, code)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("plates")
      .select(
        "id, photo_path, created_at, reviewed_at, status, profiles!plates_user_id_fkey(username), states(name, code)"
      )
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false }),
  ]);

  if (pendingRes.error) {
    console.error("Failed to load pending plates", pendingRes.error);
  }
  if (historyRes.error) {
    console.error("Failed to load plate history", historyRes.error);
  }

  const pending = (pendingRes.data ?? []) as unknown as AdminPlate[];
  const history = (historyRes.data ?? []) as unknown as AdminPlate[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Validation des plaques</h1>
      <p className="mt-1 text-sm text-slate-400">
        {pending.length} photo{pending.length > 1 ? "s" : ""} en attente.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {pending.map((plate) => {
          const photoUrl = supabase.storage
            .from("plates")
            .getPublicUrl(plate.photo_path).data.publicUrl;

          return (
            <div
              key={plate.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Photo de plaque à valider"
                className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-24 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-100">
                  {plate.states?.name}{" "}
                  <span className="font-mono text-xs text-slate-500">
                    ({plate.states?.code})
                  </span>
                </p>
                <p className="text-sm text-slate-400">
                  par {plate.profiles?.username}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={reviewPlate.bind(null, plate.id, "approved")}>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Valider
                  </button>
                </form>
                <form action={reviewPlate.bind(null, plate.id, "rejected")}>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-red-400"
                  >
                    Refuser
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {pending.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            Aucune photo en attente 🎉
          </p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-50">Historique</h2>
      <p className="mt-1 text-sm text-slate-400">
        {history.length} photo{history.length > 1 ? "s" : ""} déjà traitée
        {history.length > 1 ? "s" : ""}.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {history.map((plate) => {
          const photoUrl = supabase.storage
            .from("plates")
            .getPublicUrl(plate.photo_path).data.publicUrl;
          const status = plate.status as "approved" | "rejected";

          return (
            <div
              key={plate.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/20 p-3 sm:flex-row sm:items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Photo de plaque traitée"
                className="h-28 w-full shrink-0 rounded-lg object-cover sm:h-16 sm:w-28"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-100">
                  {plate.states?.name}{" "}
                  <span className="font-mono text-xs text-slate-500">
                    ({plate.states?.code})
                  </span>
                </p>
                <p className="text-sm text-slate-400">
                  par {plate.profiles?.username}
                  {plate.reviewed_at &&
                    ` · ${new Date(plate.reviewed_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </p>
              </div>
              <span
                className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${HISTORY_BADGE[status]}`}
              >
                {HISTORY_LABEL[status]}
              </span>
            </div>
          );
        })}

        {history.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            Aucune photo traitée pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
