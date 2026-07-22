import { requireUser } from "@/lib/auth";
import { computeScores, MAX_POINTS_PER_STATE } from "@/lib/scoring";
import { computeRarityMap } from "@/lib/geo";
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

  const rarityMap = computeRarityMap(states);

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

      <details className="group mb-8 rounded-2xl border border-amber-600/30 bg-amber-500/5 p-5 open:pb-5">
        <summary className="cursor-pointer list-none text-sm font-semibold text-amber-400 marker:hidden">
          📜 Règles du jeu{" "}
          <span className="text-amber-500/70 group-open:hidden">
            (clique pour afficher)
          </span>
        </summary>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-500/80">
          Photos
        </p>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-300">
          <li>
            📸 La photo doit être une <strong>vraie plaque</strong>, vue en vrai sur
            un véhicule (route, parking...) — pas une photo prise en concession, en
            magasin, ni une plaque décorative ou d&apos;exposition.
          </li>
          <li>
            🚫 Pas de photo trouvée sur internet ou réutilisée : elle doit être prise
            par toi, pendant le roadtrip.
          </li>
          <li>
            🔁 Pas d&apos;échange de photos entre joueurs : chacun doit prendre sa
            propre photo de chaque plaque, pas celle d&apos;un autre participant.
          </li>
          <li>
            ✅ Chaque photo est vérifiée par un admin avant de valider les 50 points.
            Si elle est refusée, tu peux en reprendre une nouvelle.
          </li>
        </ul>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-amber-500/80">
          Quiz
        </p>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-300">
          <li>
            🧠 Le quiz (2 questions, 25 pts chacune) se débloque juste après l&apos;envoi
            de la photo, une seule tentative par question.
          </li>
          <li>
            🙋 Réponds <strong>seul(e)</strong>, de tête — pas de question posée aux
            autres participants ni de réponse soufflée.
          </li>
          <li>
            🚫 Sans recherche Internet, sans Google, sans IA : c&apos;est le fair-play
            qui fait le jeu, pas le score.
          </li>
        </ul>
      </details>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {states.map((state) => (
          <StateCard
            key={state.code}
            code={state.code}
            name={state.name}
            rarity={rarityMap[state.code].rarity}
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
