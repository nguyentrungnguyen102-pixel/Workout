export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  WorkoutSummary: undefined;
  ExercisePicker: undefined;
  LogDetail: { logId: string; date: string };
  AddMetric: undefined;
  ProgramsList: undefined;
  ProgramDetail: { programId: string };
};

export type MainTabParamList = {
  QuickAdd: undefined;
  History: undefined;
  Body: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};
