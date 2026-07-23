interface MapLeaderboardEntry {
  id: string;
  username: string;
  firstTry: number;
  secondTry: number;
  points: number;
  isCurrentUser: boolean;
}

export default function MapLeaderboard({
  entries,
  maxPoints,
}: {
  entries: MapLeaderboardEntry[];
  maxPoints: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-200">🗺️ Classement carte</h3>
      <ol className="mt-3 flex flex-col gap-1.5">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm ${
              entry.isCurrentUser
                ? "bg-sky-500/10 text-sky-300"
                : "text-slate-300"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-5 shrink-0 text-xs font-bold text-slate-500">
                #{index + 1}
              </span>
              <span className="truncate">
                {entry.username}
                {entry.isCurrentUser && (
                  <span className="ml-1 text-xs font-normal text-sky-400">
                    (toi)
                  </span>
                )}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3 text-right text-xs">
              <span title="Trouvé du 1er coup (30 pts)" className="text-emerald-400">
                🥇 {entry.firstTry}
              </span>
              <span title="Trouvé du 2e coup (10 pts)" className="text-amber-400">
                🥈 {entry.secondTry}
              </span>
              <span className="text-sm font-semibold text-slate-100">
                {entry.points}/{maxPoints}
              </span>
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-slate-500">Personne pour l&apos;instant.</li>
        )}
      </ol>
    </div>
  );
}
