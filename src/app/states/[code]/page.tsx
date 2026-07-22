import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { computeRarityMap, PLATE_POINTS_BY_RARITY, RARITY_LABEL, RARITY_STYLE } from "@/lib/geo";
import { POINTS_PER_ANSWER } from "@/lib/scoring";
import type { PlateRow, QuestionType, QuizAnswerRow, StateRow } from "@/types/database";
import PhotoUpload from "@/components/PhotoUpload";
import Quiz from "@/components/Quiz";

export default async function StatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const stateCode = code.toUpperCase();
  const { supabase, user } = await requireUser();

  const [stateRes, allStatesRes, plateRes, answersRes] = await Promise.all([
    supabase.from("states").select("*").eq("code", stateCode).single(),
    supabase.from("states").select("*").order("sort_order"),
    supabase
      .from("plates")
      .select("*")
      .eq("user_id", user.id)
      .eq("state_code", stateCode)
      .maybeSingle(),
    supabase
      .from("quiz_answers")
      .select("*")
      .eq("user_id", user.id)
      .eq("state_code", stateCode),
  ]);

  const state = stateRes.data as StateRow | null;
  if (!state) notFound();

  const allStates = (allStatesRes.data ?? []) as StateRow[];
  const plate = (plateRes.data ?? null) as PlateRow | null;
  const answers = (answersRes.data ?? []) as QuizAnswerRow[];

  const answeredTypes: Partial<Record<QuestionType, boolean>> = {};
  for (const answer of answers) {
    answeredTypes[answer.question_type] = answer.is_correct;
  }

  const photoUrl = plate
    ? supabase.storage.from("plates").getPublicUrl(plate.photo_path).data.publicUrl
    : null;

  const rarity = computeRarityMap(allStates)[state.code]?.rarity ?? "commun";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-sky-400 hover:text-sky-300">
        ← Retour à ma collection
      </Link>

      <h1 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-50">
        {state.name}{" "}
        <span className="font-mono text-lg text-slate-400">({state.code})</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RARITY_STYLE[rarity]}`}
        >
          {RARITY_LABEL[rarity]}
        </span>
      </h1>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          1. Plaque d&apos;immatriculation · {PLATE_POINTS_BY_RARITY[rarity]} pts
        </h2>
        <PhotoUpload
          stateCode={state.code}
          userId={user.id}
          plate={plate}
          photoUrl={photoUrl}
          platePoints={PLATE_POINTS_BY_RARITY[rarity]}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          2. Quiz · {POINTS_PER_ANSWER} pts par bonne réponse
        </h2>
        {plate ? (
          <Quiz
            userId={user.id}
            state={state}
            allStates={allStates}
            answeredTypes={answeredTypes}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
            Envoie d&apos;abord une photo de la plaque pour débloquer le quiz.
          </p>
        )}
      </section>
    </div>
  );
}
