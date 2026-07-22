import Link from "next/link";
import type { StateProgress } from "@/lib/scoring";
import { MAX_POINTS_PER_STATE } from "@/lib/scoring";

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
}: {
  code: string;
  name: string;
  progress: StateProgress;
}) {
  const quizAnswered =
    (progress.capitalCorrect !== null ? 1 : 0) +
    (progress.populationCorrect !== null ? 1 : 0);

  return (
    <Link
      href={`/states/${code}`}
      className={`flex flex-col gap-2 rounded-xl border p-3 transition hover:border-sky-500/60 hover:bg-slate-800/40 ${STATUS_STYLES[progress.plateStatus]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-slate-400">{code}</p>
          <p className="font-semibold leading-tight text-slate-50">{name}</p>
        </div>
        <span className="rounded-full bg-slate-950/60 px-2 py-0.5 text-xs font-bold text-slate-200">
          {progress.points}/{MAX_POINTS_PER_STATE}
        </span>
      </div>
      <p className="text-xs text-slate-400">{STATUS_LABEL[progress.plateStatus]}</p>
      <div className="mt-auto flex gap-1">
        {[0, 1].map((i) => {
          const correct = i === 0 ? progress.capitalCorrect : progress.populationCorrect;
          return (
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
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">{quizAnswered}/2 questions</p>
    </Link>
  );
}
