import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { computeScores, maxTotalPoints, MAX_POINTS_BY_RARITY } from "@/lib/scoring";
import { computeRarityMap } from "@/lib/geo";
import type { PlateRow, ProfileRow, QuizAnswerRow, StateRow } from "@/types/database";
import ProgressBar from "@/components/ProgressBar";
import PlayerStateCard from "@/components/PlayerStateCard";

export default async function PlayerProgressPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, user } = await requireUser();

  const [profileRes, statesRes, platesRes, answersRes, allApprovedRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("states").select("*").order("sort_order"),
      supabase.from("plates").select("*").eq("user_id", userId),
      supabase.from("quiz_answers").select("*").eq("user_id", userId),
      supabase.from("plates").select("state_code").eq("status", "approved"),
    ]);

  const profile = profileRes.data as ProfileRow | null;
  if (!profile) notFound();

  const states = (statesRes.data ?? []) as StateRow[];
  const plates = (platesRes.data ?? []) as PlateRow[];
  const answers = (answersRes.data ?? []) as QuizAnswerRow[];
  const claimedStateCodes = new Set(
    (allApprovedRes.data ?? []).map((p) => p.state_code)
  );

  const rarityMap = computeRarityMap(states);
  const scores = computeScores(plates, answers, rarityMap);
  const score = scores[userId];
  const totalPoints = score?.totalPoints ?? 0;
  const maxTotal = maxTotalPoints(rarityMap);
  const statesCompleted = score?.statesCompleted ?? 0;

  const found: StateRow[] = [];
  const missing: StateRow[] = [];
  for (const state of states) {
    if (score?.perState[state.code]?.plateStatus === "approved") {
      found.push(state);
    } else {
      missing.push(state);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/leaderboard" className="text-sm text-sky-400 hover:text-sky-300">
        ← Retour au classement
      </Link>

      <div className="mb-8 mt-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
        <h1 className="text-xl font-bold text-slate-50 sm:text-2xl">
          {profile.username}
          {profile.id === user.id && (
            <span className="ml-2 text-sm font-normal text-sky-400">(toi)</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {statesCompleted}/{states.length} états complétés (plaque + quiz) ·{" "}
          {found.length}/{states.length} plaques trouvées
        </p>
        <div className="mt-4 flex items-center gap-4">
          <ProgressBar value={totalPoints} max={maxTotal} className="flex-1" />
          <span className="shrink-0 text-sm font-semibold text-slate-200">
            {totalPoints}/{maxTotal} pts
          </span>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-50">
        États trouvés ({found.length})
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {found.map((state) => (
          <PlayerStateCard
            key={state.code}
            code={state.code}
            name={state.name}
            rarity={rarityMap[state.code].rarity}
            progress={score.perState[state.code]}
            claimedByOther={false}
          />
        ))}
        {found.length === 0 && (
          <p className="col-span-full text-sm text-slate-500">
            Aucun état trouvé pour l&apos;instant.
          </p>
        )}
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-50">
        États manquants ({missing.length})
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {missing.map((state) => (
          <PlayerStateCard
            key={state.code}
            code={state.code}
            name={state.name}
            rarity={rarityMap[state.code].rarity}
            progress={
              score?.perState[state.code] ?? {
                plateStatus: "none",
                capitalCorrect: null,
                populationCorrect: null,
                mapCorrect: null,
                mapPoints: 0,
                points: 0,
                maxPoints: MAX_POINTS_BY_RARITY[rarityMap[state.code].rarity],
              }
            }
            claimedByOther={claimedStateCodes.has(state.code)}
          />
        ))}
        {missing.length === 0 && (
          <p className="col-span-full text-sm text-slate-500">
            Toutes les plaques ont été trouvées ! 🎉
          </p>
        )}
      </div>
    </div>
  );
}
