import { requireUser } from "@/lib/auth";
import {
  CHALLENGES_PER_STATE,
  computeScores,
  maxTotalPoints,
  MAP_POINTS_FIRST_TRY,
  MAP_POINTS_SECOND_TRY,
  MAX_QUIZ_POINTS_PER_STATE,
  POINTS_PER_ANSWER,
} from "@/lib/scoring";
import type { PlateRow, ProfileRow, QuizAnswerRow, StateRow } from "@/types/database";
import {
  computeRarityMap,
  PLATE_POINTS_BY_RARITY,
  RARITY_EMOJI,
  RARITY_LABEL,
  RARITY_ORDER,
  type Rarity,
} from "@/lib/geo";
import ProgressBar from "@/components/ProgressBar";
import MiniLeaderboard from "@/components/MiniLeaderboard";
import MapLeaderboard from "@/components/MapLeaderboard";

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

  const rarityMap = computeRarityMap(states);
  const scores = computeScores(plates, answers, rarityMap);
  const maxTotal = maxTotalPoints(rarityMap);

  const ranking = profiles
    .map((profile) => ({
      profile,
      score: scores[profile.id] ?? {
        totalPoints: 0,
        statesCompleted: 0,
        platePoints: 0,
        quizPoints: 0,
        platesApprovedCount: 0,
      },
    }))
    .sort((a, b) => b.score.totalPoints - a.score.totalPoints);

  const plateRanking = [...ranking]
    .sort((a, b) => b.score.platePoints - a.score.platePoints)
    .map(({ profile, score }) => ({
      id: profile.id,
      username: profile.username,
      points: score.platePoints,
      count: score.platesApprovedCount,
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

  const maxPlatePoints = states.reduce(
    (sum, s) => sum + PLATE_POINTS_BY_RARITY[rarityMap[s.code].rarity],
    0
  );
  const maxQuizPoints = states.length * MAX_QUIZ_POINTS_PER_STATE;

  const emptyTierCounts = (): Record<Rarity, number> =>
    Object.fromEntries(RARITY_ORDER.map((tier) => [tier, 0])) as Record<
      Rarity,
      number
    >;

  const tierTotals = emptyTierCounts();
  for (const state of states) {
    tierTotals[rarityMap[state.code].rarity] += 1;
  }

  const tierCountsByUser: Record<string, Record<Rarity, number>> = {};
  for (const plate of plates) {
    if (plate.status !== "approved") continue;
    const tier = rarityMap[plate.state_code]?.rarity;
    if (!tier) continue;
    if (!tierCountsByUser[plate.user_id]) {
      tierCountsByUser[plate.user_id] = emptyTierCounts();
    }
    tierCountsByUser[plate.user_id][tier] += 1;
  }

  const rarityRankings = RARITY_ORDER.map((tier) => ({
    tier,
    entries: [...ranking]
      .map(({ profile }) => ({
        id: profile.id,
        username: profile.username,
        points: tierCountsByUser[profile.id]?.[tier] ?? 0,
        isCurrentUser: profile.id === user.id,
      }))
      .sort((a, b) => b.points - a.points),
  }));

  const mapStatsByUser: Record<string, { firstTry: number; secondTry: number }> = {};
  for (const answer of answers) {
    if (answer.question_type !== "map" || !answer.is_correct) continue;
    if (!mapStatsByUser[answer.user_id]) {
      mapStatsByUser[answer.user_id] = { firstTry: 0, secondTry: 0 };
    }
    if (answer.attempt === 1) mapStatsByUser[answer.user_id].firstTry += 1;
    else mapStatsByUser[answer.user_id].secondTry += 1;
  }

  const mapRanking = [...ranking]
    .map(({ profile }) => {
      const stats = mapStatsByUser[profile.id] ?? { firstTry: 0, secondTry: 0 };
      return {
        id: profile.id,
        username: profile.username,
        firstTry: stats.firstTry,
        secondTry: stats.secondTry,
        points: stats.firstTry * MAP_POINTS_FIRST_TRY + stats.secondTry * MAP_POINTS_SECOND_TRY,
        isCurrentUser: profile.id === user.id,
      };
    })
    .sort((a, b) => b.points - a.points);

  const maxMapPoints = states.length * MAP_POINTS_FIRST_TRY;

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
          totalCount={states.length * CHALLENGES_PER_STATE}
          countLabel="bonnes réponses"
          entries={quizRanking}
        />
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-50">Classement par rareté</h2>
      <p className="mt-1 text-sm text-slate-400">
        Qui a mis la main sur le plus de plaques validées de chaque niveau de
        rareté.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rarityRankings.map(({ tier, entries }) => (
          <MiniLeaderboard
            key={tier}
            title={`${RARITY_EMOJI[tier]} ${RARITY_LABEL[tier]}`}
            maxPoints={tierTotals[tier]}
            entries={entries}
          />
        ))}
      </div>

      <h2 className="mt-10 text-lg font-bold text-slate-50">Classement carte</h2>
      <p className="mt-1 text-sm text-slate-400">
        🥇 = trouvé du 1er coup (30 pts) · 🥈 = trouvé du 2e coup (10 pts).
      </p>

      <div className="mt-4">
        <MapLeaderboard entries={mapRanking} maxPoints={maxMapPoints} />
      </div>
    </div>
  );
}
