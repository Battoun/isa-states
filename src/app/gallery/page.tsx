import { requireUser } from "@/lib/auth";
import { computeRarityMap, RARITY_LABEL, RARITY_STYLE } from "@/lib/geo";
import type { StateRow } from "@/types/database";

interface GalleryPlate {
  id: string;
  state_code: string;
  photo_path: string;
  profiles: { username: string } | null;
}

export default async function GalleryPage() {
  const { supabase } = await requireUser();

  const [statesRes, platesRes] = await Promise.all([
    supabase.from("states").select("*").order("sort_order"),
    supabase
      .from("plates")
      .select(
        "id, state_code, photo_path, profiles!plates_user_id_fkey(username)"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
  ]);

  const states = (statesRes.data ?? []) as StateRow[];
  const plates = (platesRes.data ?? []) as unknown as GalleryPlate[];
  const rarityMap = computeRarityMap(states);

  const platesByState = new Map<string, GalleryPlate[]>();
  for (const plate of plates) {
    if (!platesByState.has(plate.state_code)) {
      platesByState.set(plate.state_code, []);
    }
    platesByState.get(plate.state_code)!.push(plate);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Galerie</h1>
      <p className="mt-1 text-sm text-slate-400">
        Toutes les plaques validées, état par état.
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {states.map((state) => {
          const statePlates = platesByState.get(state.code) ?? [];
          const rarity = rarityMap[state.code].rarity;

          return (
            <section key={state.code}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-50">
                  {state.name}{" "}
                  <span className="font-mono text-sm text-slate-500">
                    ({state.code})
                  </span>
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RARITY_STYLE[rarity]}`}
                >
                  {RARITY_LABEL[rarity]}
                </span>
                <span className="text-xs text-slate-500">
                  {statePlates.length} photo{statePlates.length !== 1 ? "s" : ""}
                </span>
              </div>

              {statePlates.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {statePlates.map((plate) => {
                    const photoUrl = supabase.storage
                      .from("plates")
                      .getPublicUrl(plate.photo_path).data.publicUrl;

                    return (
                      <figure
                        key={plate.id}
                        className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl}
                          alt={`Plaque de ${state.name}`}
                          className="aspect-video w-full object-cover"
                        />
                        <figcaption className="px-2 py-1.5 text-xs text-slate-400">
                          par {plate.profiles?.username ?? "?"}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-500">
                  Personne ne l&apos;a encore trouvé.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
