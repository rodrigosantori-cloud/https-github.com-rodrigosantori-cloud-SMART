export interface CriteriaEvaluation {
  name: string;
  rating: string;
  score: number;
  analysis: string;
  suggestions: string;
}

export interface SMARTResult {
  adherencePercentage: number;
  overallVerdict: string;
  criteria: {
    S: CriteriaEvaluation;
    M: CriteriaEvaluation;
    A: CriteriaEvaluation;
    R: CriteriaEvaluation;
    T: CriteriaEvaluation;
  };
  refinedGoal: string;
}

export interface SMARTGoalInput {
  goal: string;
  s: string;
  m: string;
  a: string;
  r: string;
  t: string;
}

export interface GoalExample {
  title: string;
  description: string;
  goal: string;
  s: string;
  m: string;
  a: string;
  r: string;
  t: string;
}
