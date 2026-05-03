import { create } from 'zustand';
import { dayKey, getDb } from '../db/client';
import { MuscleGroupSlug } from '../logic/muscleGroups';
import { fetchExercisesForGroup, NormalizedExercise } from '../services/exerciseApi';
import { useStreakStore } from './streakStore';
import { useBadgeStore } from './badgeStore';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroupSlug;
  description: string;
  imageUrl: string | null;
  source: 'seed' | 'wger' | 'exercisedb';
}

export interface WorkoutLogInput {
  exerciseId: string;
  muscleGroup: MuscleGroupSlug;
  sets: number;
  reps: number;
  weightKg?: number | null;
}

interface WorkoutState {
  /** Exercises grouped by slug, kept in memory for quick screen rendering. */
  byGroup: Partial<Record<MuscleGroupSlug, Exercise[]>>;
  /** Per-group fetch state — UI shows spinners / errors based on this. */
  fetching: Partial<Record<MuscleGroupSlug, boolean>>;
  fetchError: Partial<Record<MuscleGroupSlug, string | null>>;

  /** Read from cache (always offline-safe). */
  loadGroup: (slug: MuscleGroupSlug) => Promise<void>;
  /** Read from cache, then attempt network refresh in the background. */
  refreshGroup: (slug: MuscleGroupSlug) => Promise<void>;
  /** Persist a workout log + bump streak. */
  logWorkout: (input: WorkoutLogInput) => Promise<void>;
  /** How many distinct exercises were logged today. */
  countLogsForDay: (day?: string) => Promise<number>;
}

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: MuscleGroupSlug;
  description: string;
  image_url: string | null;
  source: 'seed' | 'wger' | 'exercisedb';
}

function rowToExercise(r: ExerciseRow): Exercise {
  return {
    id: r.id,
    name: r.name,
    muscleGroup: r.muscle_group,
    description: r.description,
    imageUrl: r.image_url,
    source: r.source,
  };
}

async function readGroupFromDb(slug: MuscleGroupSlug): Promise<Exercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT id, name, muscle_group, description, image_url, source
       FROM exercises
      WHERE muscle_group = ?
      ORDER BY source ASC, name ASC;`,
    [slug]
  );
  return rows.map(rowToExercise);
}

async function upsertFetched(items: NormalizedExercise[]): Promise<void> {
  if (items.length === 0) return;
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const ex of items) {
      await db.runAsync(
        `INSERT INTO exercises
            (id, name, muscle_group, description, image_url, source, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            image_url = excluded.image_url,
            updated_at = excluded.updated_at;`,
        [ex.id, ex.name, ex.muscleGroup, ex.description, ex.imageUrl, ex.source, now]
      );
    }
  });
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  byGroup: {},
  fetching: {},
  fetchError: {},

  loadGroup: async (slug) => {
    const list = await readGroupFromDb(slug);
    set(state => ({ byGroup: { ...state.byGroup, [slug]: list } }));
  },

  refreshGroup: async (slug) => {
    // Always show cache first — non-blocking UI.
    if (!get().byGroup[slug]) {
      const cached = await readGroupFromDb(slug);
      set(state => ({ byGroup: { ...state.byGroup, [slug]: cached } }));
    }
    set(state => ({
      fetching: { ...state.fetching, [slug]: true },
      fetchError: { ...state.fetchError, [slug]: null },
    }));
    try {
      const remote = await fetchExercisesForGroup(slug, { limit: 15 });
      await upsertFetched(remote);
      const merged = await readGroupFromDb(slug);
      set(state => ({
        byGroup: { ...state.byGroup, [slug]: merged },
        fetching: { ...state.fetching, [slug]: false },
      }));
    } catch (e: any) {
      // Offline / API down — surface gently, keep showing cache.
      set(state => ({
        fetching: { ...state.fetching, [slug]: false },
        fetchError: { ...state.fetchError, [slug]: e?.message ?? 'Network error' },
      }));
    }
  },

  logWorkout: async (input) => {
    const db = await getDb();
    const now = Date.now();
    const today = dayKey();
    await db.runAsync(
      `INSERT INTO workout_logs
         (exercise_id, muscle_group, sets, reps, weight_kg, logged_at, day_key)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        input.exerciseId,
        input.muscleGroup,
        input.sets,
        input.reps,
        input.weightKg ?? null,
        now,
        today,
      ]
    );
    // Streak bump is a side-effect of logging — keep them coupled here so
    // callers can't forget. registerWorkoutToday is idempotent per day.
    await useStreakStore.getState().registerWorkoutToday();
    // Badge evaluation reads the just-updated streak/volume; idempotent.
    await useBadgeStore.getState().evaluate();
  },

  countLogsForDay: async (day) => {
    const db = await getDb();
    const target = day ?? dayKey();
    const row = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) as n FROM workout_logs WHERE day_key = ?;',
      [target]
    );
    return row?.n ?? 0;
  },
}));
