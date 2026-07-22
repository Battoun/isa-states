import { requireUser } from "@/lib/auth";
import { computeScores, MAX_POINTS_PER_STATE } from "@/lib/scoring";
import type { PlateRow, QuizAnswerRow, StateRow } from "@/types/database";
import StateCard from "@/components/StateCard";
import ProgressBar from "@/components/ProgressBar";

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser();

  const [statesRes, platesRes, answersRes] = await Promise.all([
    supabase.from("states").select("*").order("sort_order"),
    supabase.from("plates").select("*").eq("user_id", user.id),
    supabase.from("quiz_answers").select("*").eq("user_id", user.id),
  ]);

  const states = (statesRes.data ?? []) as StateRow[];
  const plates = (platesRes.data ?? []) as PlateRow[];
  const answers = (answersRes.data ?? []) as QuizAnswerRow[];

  const scores = computeScores(plates, answers);
  const myScore = scores[user.id];
  const totalPoints = myScore?.totalPoints ?? 0;
  const statesCompleted = myScore?.statesCompleted ?? 0;
  const maxTotal = states.length * MAX_POINTS_PER_STATE;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        <h1 className="text-xl font-bold text-slate-50 sm:text-2xl">
          Salut {profile.username} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {statesCompleted}/{states.length} états complétés (plaque + quiz)
        </p>
        <div className="mt-4 flex items-center gap-4">
          <ProgressBar value={totalPoints} max={maxTotal} className="flex-1" />
          <span className="shrink-0 text-sm font-semibold text-slate-200">
            {totalPoints}/{maxTotal} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {states.map((state) => (
          <StateCard
            key={state.code}
            code={state.code}
            name={state.name}
            progress={
              myScore?.perState[state.code] ?? {
                plateStatus: "none",
                capitalCorrect: null,
                populationCorrect: null,
                points: 0,
              }
            }
          />
        ))}
      </div>
    </div>
  );
}
