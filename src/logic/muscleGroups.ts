/**
 * Canonical muscle group taxonomy. Every exercise — seeded or API-fetched —
 * normalizes to one of these slugs. The Wger adapter maps Wger muscle IDs
 * onto these; if you ever swap to ExerciseDB, only the adapter changes.
 */

export type MuscleGroupSlug =
  | 'biceps'
  | 'triceps'
  | 'shoulders'
  | 'back'
  | 'chest'
  | 'legs'
  | 'cardio';

export interface MuscleGroup {
  slug: MuscleGroupSlug;
  label: string;
  // Wger primary muscle IDs that count toward this group. Used by the API
  // adapter to map upstream → canonical. Empty for cardio (filtered by category).
  wgerMuscleIds: number[];
  // Wger category id (only used for cardio).
  wgerCategoryId?: number;
}

export const MUSCLE_GROUPS: ReadonlyArray<MuscleGroup> = [
  { slug: 'chest',     label: 'Chest',     wgerMuscleIds: [4] },        // Pectoralis major
  { slug: 'back',      label: 'Back',      wgerMuscleIds: [12, 9] },    // Lats, Traps
  { slug: 'shoulders', label: 'Shoulders', wgerMuscleIds: [2] },        // Anterior deltoid
  { slug: 'biceps',    label: 'Biceps',    wgerMuscleIds: [1, 13] },    // Biceps, Brachialis
  { slug: 'triceps',   label: 'Triceps',   wgerMuscleIds: [5] },        // Triceps brachii
  { slug: 'legs',      label: 'Legs',      wgerMuscleIds: [10, 11, 8] },// Quads, Hamstrings, Glutes
  { slug: 'cardio',    label: 'Cardio',    wgerMuscleIds: [], wgerCategoryId: 15 },
];

export function muscleGroupBySlug(slug: string): MuscleGroup | undefined {
  return MUSCLE_GROUPS.find(g => g.slug === slug);
}
