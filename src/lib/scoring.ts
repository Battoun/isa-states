import type { PlateRow, QuizAnswerRow } from "@/types/database";
import { PLATE_POINTS_BY_RARITY, type Rarity, type StateRarity } from "@/lib/geo";

export const POINTS_PER_ANSWER = 10; // capital & population questions
export const MAP_POINTS_FIRST_TRY = 30;
export const MAP_POINTS_SECOND_TRY = 10;
export const CHALLENGES_PER_STATE = 3; // capital + population + map placement

export const MAX_QUIZ_POINTS_PER_STATE =
  POINTS_PER_ANSWER * 2 + MAP_POINTS_FIRST_TRY;

export const MAX_POINTS_BY_RARITY: Record<Rarity, number> = Object.fromEntries(
  (Object.entries(PLATE_POINTS_BY_RARITY) as [Rarity, number][]).map(
    ([tier, platePoints]) => [tier, platePoints + MAX_QUIZ_POINTS_PER_STATE]
  )
) as Record<Rarity, number>;

export interface StateProgress {
  plateStatus: "none" | "pending" | "approved" | "rejected";
  capitalCorrect: boolean | null;
  populationCorrect: boolean | null;
  /** null = not resolved yet (no attempt, or 1st try wrong with a retry left) */
  mapCorrect: boolean | null;
  mapPoints: number;
  points: number;
  maxPoints: number;
}

export interface UserScore {
  userId: string;
  platePoints: number;
  quizPoints: number;
  totalPoints: number;
  platesApprovedCount: number;
  correctAnswersCount: number;
  statesCompleted: number;
  perState: Record<string, StateProgress>;
}

interface MapAttempts {
  first: boolean | null;
  second: boolean | null;
}

export function maxTotalPoints(rarityByCode: Record<string, StateRarity>): number {
  return Object.values(rarityByCode).reduce(
    (sum, { rarity }) => sum + MAX_POINTS_BY_RARITY[rarity],
    0
  );
}

export function computeScores(
  plates: PlateRow[],
  answers: QuizAnswerRow[],
  rarityByCode: Record<string, StateRarity>
): Record<string, UserScore> {
  const scores: Record<string, UserScore> = {};
  const mapAttemptsByUserState = new Map<string, MapAttempts>();

  const ensureUser = (userId: string): UserScore => {
    if (!scores[userId]) {
      scores[userId] = {
        userId,
        platePoints: 0,
        quizPoints: 0,
        totalPoints: 0,
        platesApprovedCount: 0,
        correctAnswersCount: 0,
        statesCompleted: 0,
        perState: {},
      };
    }
    return scores[userId];
  };

  const ensureState = (score: UserScore, stateCode: string): StateProgress => {
    if (!score.perState[stateCode]) {
      const rarity = rarityByCode[stateCode]?.rarity ?? "commun";
      score.perState[stateCode] = {
        plateStatus: "none",
        capitalCorrect: null,
        populationCorrect: null,
        mapCorrect: null,
        mapPoints: 0,
        points: 0,
        maxPoints: MAX_POINTS_BY_RARITY[rarity],
      };
    }
    return score.perState[stateCode];
  };

  const ensureMapAttempts = (userId: string, stateCode: string): MapAttempts => {
    const key = `${userId}:${stateCode}`;
    if (!mapAttemptsByUserState.has(key)) {
      mapAttemptsByUserState.set(key, { first: null, second: null });
    }
    return mapAttemptsByUserState.get(key)!;
  };

  for (const plate of plates) {
    const score = ensureUser(plate.user_id);
    const state = ensureState(score, plate.state_code);
    state.plateStatus = plate.status;
    if (plate.status === "approved") {
      const rarity = rarityByCode[plate.state_code]?.rarity ?? "commun";
      score.platePoints += PLATE_POINTS_BY_RARITY[rarity];
      score.platesApprovedCount += 1;
    }
  }

  for (const answer of answers) {
    const score = ensureUser(answer.user_id);
    const state = ensureState(score, answer.state_code);

    if (answer.question_type === "capital") {
      state.capitalCorrect = answer.is_correct;
    } else if (answer.question_type === "population") {
      state.populationCorrect = answer.is_correct;
    } else {
      const attempts = ensureMapAttempts(answer.user_id, answer.state_code);
      if (answer.attempt === 1) attempts.first = answer.is_correct;
      else attempts.second = answer.is_correct;
    }
  }

  for (const [key, attempts] of mapAttemptsByUserState.entries()) {
    const [userId, stateCode] = key.split(":");
    const state = ensureState(scores[userId], stateCode);

    if (attempts.first === true) {
      state.mapCorrect = true;
      state.mapPoints = MAP_POINTS_FIRST_TRY;
    } else if (attempts.first === false && attempts.second === true) {
      state.mapCorrect = true;
      state.mapPoints = MAP_POINTS_SECOND_TRY;
    } else if (attempts.first === false && attempts.second === false) {
      state.mapCorrect = false;
      state.mapPoints = 0;
    }
    // attempts.first === false && attempts.second === null: a retry is still
    // available, so mapCorrect stays null (not resolved yet).
  }

  for (const score of Object.values(scores)) {
    for (const [stateCode, state] of Object.entries(score.perState)) {
      const rarity = rarityByCode[stateCode]?.rarity ?? "commun";
      let points = 0;
      if (state.plateStatus === "approved") points += PLATE_POINTS_BY_RARITY[rarity];
      if (state.capitalCorrect) points += POINTS_PER_ANSWER;
      if (state.populationCorrect) points += POINTS_PER_ANSWER;
      points += state.mapPoints;
      state.points = points;

      score.quizPoints +=
        (state.capitalCorrect ? POINTS_PER_ANSWER : 0) +
        (state.populationCorrect ? POINTS_PER_ANSWER : 0) +
        state.mapPoints;

      score.correctAnswersCount +=
        (state.capitalCorrect ? 1 : 0) +
        (state.populationCorrect ? 1 : 0) +
        (state.mapCorrect ? 1 : 0);

      const quizFinished =
        state.capitalCorrect !== null &&
        state.populationCorrect !== null &&
        state.mapCorrect !== null;
      if (quizFinished) score.statesCompleted += 1;
    }
    score.totalPoints = score.platePoints + score.quizPoints;
  }

  return scores;
}
