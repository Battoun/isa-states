import type { PlateRow, QuizAnswerRow } from "@/types/database";

export const POINTS_PER_PLATE = 50;
export const POINTS_PER_ANSWER = 25;
export const MAX_QUIZ_POINTS_PER_STATE = 50;
export const MAX_POINTS_PER_STATE = 100;

export interface StateProgress {
  plateStatus: "none" | "pending" | "approved" | "rejected";
  capitalCorrect: boolean | null;
  populationCorrect: boolean | null;
  points: number;
}

export interface UserScore {
  userId: string;
  platePoints: number;
  quizPoints: number;
  totalPoints: number;
  statesCompleted: number;
  perState: Record<string, StateProgress>;
}

export function computeScores(
  plates: PlateRow[],
  answers: QuizAnswerRow[]
): Record<string, UserScore> {
  const scores: Record<string, UserScore> = {};

  const ensureUser = (userId: string): UserScore => {
    if (!scores[userId]) {
      scores[userId] = {
        userId,
        platePoints: 0,
        quizPoints: 0,
        totalPoints: 0,
        statesCompleted: 0,
        perState: {},
      };
    }
    return scores[userId];
  };

  const ensureState = (score: UserScore, stateCode: string): StateProgress => {
    if (!score.perState[stateCode]) {
      score.perState[stateCode] = {
        plateStatus: "none",
        capitalCorrect: null,
        populationCorrect: null,
        points: 0,
      };
    }
    return score.perState[stateCode];
  };

  for (const plate of plates) {
    const score = ensureUser(plate.user_id);
    const state = ensureState(score, plate.state_code);
    state.plateStatus = plate.status;
    if (plate.status === "approved") {
      score.platePoints += POINTS_PER_PLATE;
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
    for (const state of Object.values(score.perState)) {
      let points = 0;
      if (state.plateStatus === "approved") points += POINTS_PER_PLATE;
      if (state.capitalCorrect) points += POINTS_PER_ANSWER;
      if (state.populationCorrect) points += POINTS_PER_ANSWER;
      state.points = points;
      if (points === MAX_POINTS_PER_STATE) score.statesCompleted += 1;
    }
  }

  return scores;
}
