export type PlateStatus = "pending" | "approved" | "rejected";
export type QuestionType = "capital" | "population" | "map";

export type StateRow = {
  code: string;
  name: string;
  capital: string;
  population: number;
  sort_order: number;
};

export type ProfileRow = {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
};

export type PlateRow = {
  id: string;
  user_id: string;
  state_code: string;
  photo_path: string;
  status: PlateStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type QuizAnswerRow = {
  id: string;
  user_id: string;
  state_code: string;
  question_type: QuestionType;
  attempt: number;
  is_correct: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      states: {
        Row: StateRow;
        Insert: StateRow;
        Update: Partial<StateRow>;
        Relationships: [];
      };
      plates: {
        Row: PlateRow;
        Insert: Partial<PlateRow> & {
          user_id: string;
          state_code: string;
          photo_path: string;
        };
        Update: Partial<PlateRow>;
        Relationships: [];
      };
      quiz_answers: {
        Row: QuizAnswerRow;
        Insert: Partial<QuizAnswerRow> & {
          user_id: string;
          state_code: string;
          question_type: QuestionType;
          is_correct: boolean;
        };
        Update: Partial<QuizAnswerRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
