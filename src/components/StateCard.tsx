import Link from "next/link";
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

export default function StateCard({
  code,
  name,
  progress,
  rarity,
}: {
  code: string;
  name: string;
  progress: StateProgress;
  rarity: Rarity;
}) {
  const challengeResults = [
    progress.capitalCorrect,
    progress.populationCorrect,
    progress.mapCorrect,
  ];
  const quizAnswered = challengeResults.filter((c) => c !== null).length;

  const needsQuiz =
    progress.plateStatus === "approved" && quizAnswered < challengeResults.length;

  return (
    <Link
      href={`/states/${code}`}
      className={`flex flex-col gap-2 rounded-xl border p-3 transition hover:border-sky-500/60 hover:bg-slate-800/40 ${
        needsQuiz
          ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/60 ring-offset-2 ring-offset-slate-950"
          : STATUS_STYLES[progress.plateStatus]
      }`}
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
      <p className={`text-xs ${needsQuiz ? "font-semibold text-amber-400" : "text-slate-400"}`}>
        {needsQuiz ? "⚠️ Quiz à faire !" : STATUS_LABEL[progress.plateStatus]}
      </p>
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
      <p className="text-[11px] text-slate-500">
        {quizAnswered}/{challengeResults.length} défis
      </p>
    </Link>
  );
}
