import { requireUser } from "@/lib/auth";
import {
  computeScores,
  MAX_POINTS_PER_STATE,
  MAX_QUIZ_POINTS_PER_STATE,
  POINTS_PER_ANSWER,
  POINTS_PER_PLATE,
} from "@/lib/scoring";
import type { PlateRow, ProfileRow, QuizAnswerRow, StateRow } from "@/types/database";
import ProgressBar from "@/components/ProgressBar";
import MiniLeaderboard from "@/components/MiniLeaderboard";

export default async function LeaderboardPage() {
  const { supabase, user } = await requireUser();

  const [profilesRes, statesRes, platesRes, answersRes] = await Promise.all([
    supabase.from("profiles").select("*").order("username"),
    supabase.from("states").select("*"),
    supabase.from("plates").select("*"),
    supabase.from("quiz_answers").select("*"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const states = (statesRes.data ?? []) as StateRow[];
  const plates = (platesRes.data ?? []) as PlateRow[];
  const answers = (answersRes.data ?? []) as QuizAnswerRow[];

  const scores = computeScores(plates, answers);
  const maxTotal = states.length * MAX_POINTS_PER_STATE;

  const ranking = profiles
    .map((profile) => ({
      profile,
      score: scores[profile.id] ?? {
        totalPoints: 0,
        statesCompleted: 0,
        platePoints: 0,
        quizPoints: 0,
      },
    }))
    .sort((a, b) => b.score.totalPoints - a.score.totalPoints);

  const plateRanking = [...ranking]
    .sort((a, b) => b.score.platePoints - a.score.platePoints)
    .map(({ profile, score }) => ({
      id: profile.id,
      username: profile.username,
      points: score.platePoints,
      count: score.platePoints / POINTS_PER_PLATE,
      isCurrentUser: profile.id === user.id,
    }));

  const quizRanking = [...ranking]
    .sort((a, b) => b.score.quizPoints - a.score.quizPoints)
    .map(({ profile, score }) => ({
      id: profile.id,
      username: profile.username,
      points: score.quizPoints,
      count: score.quizPoints / POINTS_PER_ANSWER,
      isCurrentUser: profile.id === user.id,
    }));

  const maxPlatePoints = states.length * POINTS_PER_PLATE;
  const maxQuizPoints = states.length * MAX_QUIZ_POINTS_PER_STATE;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Classement</h1>
      <p className="mt-1 text-sm text-slate-400">
        L&apos;avancée de tout le monde sur les {states.length} états.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {ranking.map(({ profile, score }, index) => (
          <div
            key={profile.id}
            className={`rounded-xl border p-4 ${
              profile.id === user.id
                ? "border-sky-500/60 bg-sky-500/5"
                : "border-slate-800 bg-slate-900/40"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-500">
                  #{index + 1}
                </span>
                <span className="truncate font-semibold text-slate-100">
                  {profile.username}
                  {profile.id === user.id && (
                    <span className="ml-2 text-xs font-normal text-sky-400">
                      (toi)
                    </span>
                  )}
                </span>
              </div>
              <span className="shrink-0 text-sm font-bold text-slate-100">
                {score.totalPoints}/{maxTotal}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={score.totalPoints} max={maxTotal} className="flex-1" />
              <span className="shrink-0 text-xs text-slate-400">
                {score.statesCompleted}/{states.length} états
              </span>
            </div>
          </div>
        ))}

        {ranking.length === 0 && (
          <p className="text-sm text-slate-400">Personne ne s&apos;est encore inscrit.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-50">Détail par catégorie</h2>
      <p className="mt-1 text-sm text-slate-400">
        Le classement total se décompose en points plaques et points quiz.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MiniLeaderboard
          title="🏁 Classement plaques"
          maxPoints={maxPlatePoints}
          totalCount={states.length}
          countLabel="plaques"
          entries={plateRanking}
        />
        <MiniLeaderboard
          title="🧠 Classement quiz"
          maxPoints={maxQuizPoints}
          totalCount={states.length * 2}
          countLabel="bonnes réponses"
          entries={quizRanking}
        />
      </div>
    </div>
  );
}
