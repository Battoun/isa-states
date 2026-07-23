"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import USAMap, { type USAMapClickEvent, type USAMapCustomize } from "react-usa-map";
import { createClient } from "@/lib/supabase/client";
import { MAP_POINTS_FIRST_TRY, MAP_POINTS_SECOND_TRY } from "@/lib/scoring";
import { getDirectionHint } from "@/lib/geo";

interface MapAttempt {
  attempt: number;
  isCorrect: boolean;
}

export default function MapChallenge({
  userId,
  stateCode,
  stateName,
  attempts,
}: {
  userId: string;
  stateCode: string;
  stateName: string;
  attempts: MapAttempt[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [localAttempts, setLocalAttempts] = useState(attempts);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const attempt1 = localAttempts.find((a) => a.attempt === 1) ?? null;
  const attempt2 = localAttempts.find((a) => a.attempt === 2) ?? null;

  const solved = attempt1?.isCorrect === true || attempt2?.isCorrect === true;
  const exhausted =
    attempt1 !== null && attempt1.isCorrect === false && attempt2 !== null;
  const isDone = solved || exhausted;
  const nextAttemptNumber = !attempt1 ? 1 : !attempt2 ? 2 : null;

  const pointsEarned = attempt1?.isCorrect
    ? MAP_POINTS_FIRST_TRY
    : attempt2?.isCorrect
      ? MAP_POINTS_SECOND_TRY
      : 0;

  async function handleClick(event: USAMapClickEvent) {
    if (isDone || pending || nextAttemptNumber === null) return;
    const clicked = event.target.dataset.name;
    if (!clicked) return;

    const isCorrect = clicked === stateCode;
    setPending(true);
    const { error } = await supabase.from("quiz_answers").insert({
      user_id: userId,
      state_code: stateCode,
      question_type: "map",
      attempt: nextAttemptNumber,
      is_correct: isCorrect,
    });
    setPending(false);

    if (!error) {
      setLocalAttempts((prev) => [...prev, { attempt: nextAttemptNumber, isCorrect }]);
      if (!isCorrect) setWrongPick(clicked);
      router.refresh();
    }
  }

  const customize: USAMapCustomize = isDone
    ? {
        [stateCode]: { fill: "#34d399" },
        ...(wrongPick ? { [wrongPick]: { fill: "#ef4444" } } : {}),
      }
    : {};

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-300">
        Clique sur <strong>{stateName}</strong> sur la carte.
        {!isDone && attempt1 && (
          <span className="ml-2 font-semibold text-amber-400">
            Raté au 1er essai — indice : {getDirectionHint(stateCode)}. Dernière
            chance !
          </span>
        )}
      </p>
      <div
        className={`rounded-xl border border-slate-800 bg-slate-900/40 p-2 [&_path]:stroke-slate-950 [&_path]:stroke-[0.75] [&_path]:transition-opacity [&_svg]:h-auto [&_svg]:w-full ${
          isDone
            ? "pointer-events-none opacity-90"
            : "[&_path]:cursor-pointer [&_path:hover]:opacity-70"
        }`}
      >
        <USAMap
          onClick={handleClick}
          customize={customize}
          defaultFill="#475569"
          width={700}
          height={435}
        />
      </div>
      {isDone && (
        <p
          className={`text-sm font-medium ${
            pointsEarned > 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {pointsEarned > 0
            ? `✅ Bonne réponse ! +${pointsEarned} pts`
            : `❌ Ce n'était pas ${stateName} (en vert sur la carte).`}
        </p>
      )}
    </div>
  );
}
