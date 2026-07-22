import type { QuestionType, StateRow } from "@/types/database";

export interface QuizChoice {
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  type: QuestionType;
  prompt: string;
  choices: QuizChoice[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function formatPopulation(population: number): string {
  return `${(population / 1_000_000).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })} M habitants`;
}

function pickDistractors<T>(
  all: StateRow[],
  currentCode: string,
  extract: (s: StateRow) => T,
  count: number
): T[] {
  const pool = shuffle(all.filter((s) => s.code !== currentCode));
  const values: T[] = [];
  const seen = new Set<string>();
  for (const s of pool) {
    const value = extract(s);
    const key = String(value);
    if (!seen.has(key)) {
      seen.add(key);
      values.push(value);
    }
    if (values.length === count) break;
  }
  return values;
}

export function buildQuestions(
  state: StateRow,
  allStates: StateRow[]
): QuizQuestion[] {
  const capitalDistractors = pickDistractors(
    allStates,
    state.code,
    (s) => s.capital,
    3
  );
  const populationDistractors = pickDistractors(
    allStates,
    state.code,
    (s) => s.population,
    3
  );

  return [
    {
      type: "capital",
      prompt: `Quelle est la capitale de l'état de ${state.name} ?`,
      choices: shuffle([
        { label: state.capital, isCorrect: true },
        ...capitalDistractors.map((label) => ({ label, isCorrect: false })),
      ]),
    },
    {
      type: "population",
      prompt: `Quelle est la population approximative de ${state.name} ?`,
      choices: shuffle([
        { label: formatPopulation(state.population), isCorrect: true },
        ...populationDistractors.map((population) => ({
          label: formatPopulation(population),
          isCorrect: false,
        })),
      ]),
    },
  ];
}
