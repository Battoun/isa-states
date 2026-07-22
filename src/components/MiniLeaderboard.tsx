interface MiniLeaderboardEntry {
  id: string;
  username: string;
  points: number;
  count: number;
  isCurrentUser: boolean;
}

export default function MiniLeaderboard({
  title,
  maxPoints,
  totalCount,
  countLabel,
  entries,
}: {
  title: string;
  maxPoints: number;
  totalCount: number;
  countLabel: string;
  entries: MiniLeaderboardEntry[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ol className="mt-3 flex flex-col gap-1.5">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
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
            <span className="shrink-0 text-right">
              <span className="block font-semibold">
                {entry.points}/{maxPoints}
              </span>
              <span className="block text-[11px] font-normal text-slate-500">
                {entry.count}/{totalCount} {countLabel}
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
