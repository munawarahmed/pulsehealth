import { MuscleGroupSlug } from '../logic/muscleGroups';

/**
 * Type-safe route param contract for the root stack. Adding screens? Add
 * them here first; the rest of the app picks up the new keys automatically.
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  MuscleGroups: undefined;
  ExerciseList: { slug: MuscleGroupSlug };
  ExerciseDetail: { exerciseId: string };
  MealCatalog: undefined;
  LogMeal: { foodId: string };
  Settings: undefined;
  Badges: undefined;
  QuickLog: undefined;
};
