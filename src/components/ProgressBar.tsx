export default function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
