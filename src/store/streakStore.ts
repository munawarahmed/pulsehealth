import { create } from 'zustand';
import { dayKey, getDb } from '../db/client';
import { applyStreakLog, isStreakStale, StreakState } from '../logic/streak';

interface StreakStoreState {
  current: number;
  longest: number;
  lastActiveDay: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Call after successfully logging a workout. Idempotent per day. */
  registerWorkoutToday: () => Promise<void>;
  isStale: () => boolean;
}

interface StreakRow {
  current_days: number;
  longest_days: number;
  last_active_day: string | null;
}

/** Ensure the singleton row exists. Streak table has CHECK(id=1). */
async function ensureRow(): Promise<StreakRow> {
  const db = await getDb();
  const existing = await db.getFirstAsync<StreakRow>(
    'SELECT current_days, longest_days, last_active_day FROM streaks WHERE id = 1;'
  );
  if (existing) return existing;
  await db.runAsync(
    `INSERT INTO streaks (id, current_days, longest_days, last_active_day)
     VALUES (1, 0, 0, NULL);`
  );
  return { current_days: 0, longest_days: 0, last_active_day: null };
}

export const useStreakStore = create<StreakStoreState>((set, get) => ({
  current: 0,
  longest: 0,
  lastActiveDay: null,
  hydrated: false,

  hydrate: async () => {
    const row = await ensureRow();
    set({
      current: row.current_days,
      longest: row.longest_days,
      lastActiveDay: row.last_active_day,
      hydrated: true,
    });
  },

  registerWorkoutToday: async () => {
    const db = await getDb();
    const today = dayKey();
    const prev: StreakState = {
      currentDays: get().current,
      longestDays: get().longest,
      lastActiveDay: get().lastActiveDay,
    };
    const next = applyStreakLog(prev, today);

    // Skip the write if nothing changed (already logged today).
    if (
      next.currentDays === prev.currentDays &&
      next.longestDays === prev.longestDays &&
      next.lastActiveDay === prev.lastActiveDay
    ) {
      return;
    }

    await db.runAsync(
      `UPDATE streaks
         SET current_days = ?, longest_days = ?, last_active_day = ?
       WHERE id = 1;`,
      [next.currentDays, next.longestDays, next.lastActiveDay]
    );
    set({
      current: next.currentDays,
      longest: next.longestDays,
      lastActiveDay: next.lastActiveDay,
    });
  },

  isStale: () => {
    const { current, longest, lastActiveDay } = get();
    return isStreakStale({ currentDays: current, longestDays: longest, lastActiveDay }, dayKey());
  },
}));
