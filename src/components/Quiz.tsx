"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildQuestions, type QuizQuestion } from "@/lib/quiz";
import { POINTS_PER_ANSWER } from "@/lib/scoring";
import type { QuestionType, StateRow } from "@/types/database";

export default function Quiz({
  userId,
  state,
  allStates,
  answeredTypes,
}: {
  userId: string;
  state: StateRow;
  allStates: StateRow[];
  answeredTypes: Partial<Record<QuestionType, boolean>>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const questions = useMemo(
    () => buildQuestions(state, allStates),
    [state, allStates]
  );
  const [answered, setAnswered] =
    useState<Partial<Record<QuestionType, boolean>>>(answeredTypes);
  const [pendingType, setPendingType] = useState<QuestionType | null>(null);

  async function handleAnswer(question: QuizQuestion, isCorrect: boolean) {
    if (answered[question.type] !== undefined) return;
    setPendingType(question.type);
    const { error } = await supabase.from("quiz_answers").insert({
      user_id: userId,
      state_code: state.code,
      question_type: question.type,
      is_correct: isCorrect,
    });
    setPendingType(null);
    if (!error) {
      setAnswered((prev) => ({ ...prev, [question.type]: isCorrect }));
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question) => {
        const result = answered[question.type];
        const isAnswered = result !== undefined;

        return (
          <div
            key={question.type}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <p className="mb-3 font-medium text-slate-100">{question.prompt}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {question.choices.map((choice) => {
                const showCorrect = isAnswered && choice.isCorrect;
                return (
                  <button
                    key={choice.label}
                    type="button"
                    disabled={isAnswered || pendingType === question.type}
                    onClick={() => handleAnswer(question, choice.isCorrect)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      showCorrect
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-700 bg-slate-950/40 text-slate-200 hover:border-sky-500/60"
                    } ${isAnswered ? "cursor-default" : ""}`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <p
                className={`mt-3 text-sm font-medium ${
                  result ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result
                  ? `✅ Bonne réponse ! +${POINTS_PER_ANSWER} pts`
                  : "❌ Mauvaise réponse."}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
