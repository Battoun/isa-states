import type { StateProgress } from "@/lib/scoring";
import type { Rarity } from "@/lib/geo";
import { RARITY_LABEL, RARITY_STYLE } from "@/lib/geo";

const STATUS_STYLES: Record<StateProgress["plateStatus"], string> = {
  none: "border-slate-800 bg-slate-900/40",
  pending: "border-amber-600/50 bg-amber-500/5",
  approved: "border-emerald-600/50 bg-emerald-500/5",
  rejected: "border-red-600/50 bg-red-500/5",
};

const STATUS_LABEL: Record<StateProgress["plateStatus"], string> = {
  none: "Pas encore trouvée",
  pending: "Photo en attente",
  approved: "Plaque validée",
  rejected: "Photo refusée",
};

export default function PlayerStateCard({
  code,
  name,
  rarity,
  progress,
  claimedByOther,
}: {
  code: string;
  name: string;
  rarity: Rarity;
  progress: StateProgress;
  claimedByOther: boolean;
}) {
  const isMissing = progress.plateStatus !== "approved";
  const challengeResults = [
    progress.capitalCorrect,
    progress.populationCorrect,
    progress.mapCorrect,
  ];

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 ${STATUS_STYLES[progress.plateStatus]}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-400">{code}</p>
          <p className="font-semibold leading-tight text-slate-50">{name}</p>
          <span
            className={`mt-1 inline-block w-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${RARITY_STYLE[rarity]}`}
          >
            {RARITY_LABEL[rarity]}
          </span>
        </div>
        <span className="rounded-full bg-slate-950/60 px-2 py-0.5 text-xs font-bold text-slate-200">
          {progress.points}/{progress.maxPoints}
        </span>
      </div>
      <p className="text-xs text-slate-400">{STATUS_LABEL[progress.plateStatus]}</p>
      <div className="mt-auto flex gap-1">
        {challengeResults.map((correct, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              correct === true
                ? "bg-emerald-400"
                : correct === false
                  ? "bg-red-500"
                  : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      {isMissing && (
        <p
          className={`text-[11px] ${claimedByOther ? "text-sky-400" : "text-slate-500"}`}
        >
          {claimedByOther
            ? "🔎 Déjà trouvée par quelqu'un d'autre"
            : "Personne ne l'a encore trouvée"}
        </p>
      )}
    </div>
  );
}
