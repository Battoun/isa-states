import type { PlateRow, QuizAnswerRow } from "@/types/database";
import { PLATE_POINTS_BY_RARITY, type Rarity, type StateRarity } from "@/lib/geo";

export const POINTS_PER_ANSWER = 10;
export const MAX_QUIZ_POINTS_PER_STATE = POINTS_PER_ANSWER * 2;

export const MAX_POINTS_BY_RARITY: Record<Rarity, number> = Object.fromEntries(
  (Object.entries(PLATE_POINTS_BY_RARITY) as [Rarity, number][]).map(
    ([tier, platePoints]) => [tier, platePoints + MAX_QUIZ_POINTS_PER_STATE]
  )
) as Record<Rarity, number>;

export interface StateProgress {
  plateStatus: "none" | "pending" | "approved" | "rejected";
  capitalCorrect: boolean | null;
  populationCorrect: boolean | null;
  points: number;
  maxPoints: number;
}

export interface UserScore {
  userId: string;
  platePoints: number;
  quizPoints: number;
  totalPoints: number;
  platesApprovedCount: number;
  statesCompleted: number;
  perState: Record<string, StateProgress>;
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

  const ensureUser = (userId: string): UserScore => {
    if (!scores[userId]) {
      scores[userId] = {
        userId,
        platePoints: 0,
        quizPoints: 0,
        totalPoints: 0,
        platesApprovedCount: 0,
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
        points: 0,
        maxPoints: MAX_POINTS_BY_RARITY[rarity],
      };
    }
    return score.perState[stateCode];
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
    } else {
      state.populationCorrect = answer.is_correct;
    }
    if (answer.is_correct) {
      score.quizPoints += POINTS_PER_ANSWER;
    }
  }

  for (const score of Object.values(scores)) {
    score.totalPoints = score.platePoints + score.quizPoints;
    for (const [stateCode, state] of Object.entries(score.perState)) {
      const rarity = rarityByCode[stateCode]?.rarity ?? "commun";
      let points = 0;
      if (state.plateStatus === "approved") points += PLATE_POINTS_BY_RARITY[rarity];
      if (state.capitalCorrect) points += POINTS_PER_ANSWER;
      if (state.populationCorrect) points += POINTS_PER_ANSWER;
      state.points = points;
      const quizFinished =
        state.capitalCorrect !== null && state.populationCorrect !== null;
      if (quizFinished) score.statesCompleted += 1;
    }
  }

  return scores;
}
