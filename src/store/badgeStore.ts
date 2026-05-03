import { create } from 'zustand';
import { dayKey, getDb } from '../db/client';
import { BadgeStats, evaluateNewBadges, findBadge } from '../logic/badges';
import { useUserStore } from './userStore';
import { useStreakStore } from './streakStore';
import { dailyGoalsFor } from '../logic/macros';
import { presentLocal } from '../services/notifications';

interface BadgeStoreState {
  awarded: Set<string>;
  /** Slug of the most recently awarded badge — UI consumes once and clears. */
  justAwarded: string | null;

  hydrate: () => Promise<void>;
  /** Re-evaluate against current stats and persist newly-earned badges. */
  evaluate: () => Promise<string[]>;
  consumeJustAwarded: () => void;
}

interface BadgeRow { slug: string; awarded_at: number; }

interface VolumeRow { total_volume: number | null; }
interface CountRow { n: number | null; }
interface DayMacrosRow { day_key: string; protein_g: number; carbs_g: number; fat_g: number; }

/**
 * One round-trip per scalar so the badge evaluation stays cheap. Each query
 * is small and indexed; the JOIN-free shape keeps the query plan obvious.
 */
async function collectStats(): Promise<BadgeStats> {
  const db = await getDb();
  const streak = useStreakStore.getState();
  const user = useUserStore.getState().user;

  const vol = await db.getFirstAsync<VolumeRow>(
    `SELECT SUM(sets * reps * COALESCE(weight_kg, 0)) AS total_volume
       FROM workout_logs;`
  );
  const exCount = await db.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS n FROM workout_logs;'
  );
  const mealCount = await db.getFirstAsync<CountRow>(
    'SELECT COUNT(*) AS n FROM meals;'
  );

  // "Balanced macros" needs per-day totals against per-day goals. The goal
  // is derived from current weight, so historical days use the *current*
  // goal — acceptable simplification for a milestone signal.
  let daysWithBalancedMacros = 0;
  if (user) {
    const goals = dailyGoalsFor(user.weightKg);
    const dayRows = await db.getAllAsync<DayMacrosRow>(
      `SELECT day_key,
              SUM(protein_g) AS protein_g,
              SUM(carbs_g)   AS carbs_g,
              SUM(fat_g)     AS fat_g
         FROM meals
        GROUP BY day_key;`
    );
    const threshold = 0.8;
    daysWithBalancedMacros = dayRows.filter(d =>
      d.protein_g >= goals.proteinG * threshold &&
      d.carbs_g   >= goals.carbsG   * threshold &&
      d.fat_g     >= goals.fatG     * threshold
    ).length;
  }

  return {
    currentStreakDays: streak.current,
    longestStreakDays: streak.longest,
    totalVolumeKg: vol?.total_volume ?? 0,
    totalExercisesLogged: exCount?.n ?? 0,
    totalMealsLogged: mealCount?.n ?? 0,
    daysWithBalancedMacros,
  };
}

export const useBadgeStore = create<BadgeStoreState>((set, get) => ({
  awarded: new Set<string>(),
  justAwarded: null,

  hydrate: async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<BadgeRow>('SELECT slug FROM badges;');
    set({ awarded: new Set(rows.map(r => r.slug)) });
  },

  evaluate: async () => {
    const stats = await collectStats();
    const alreadyAwarded = get().awarded;
    const newSlugs = evaluateNewBadges(stats, alreadyAwarded);
    if (newSlugs.length === 0) return [];

    const db = await getDb();
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      for (const slug of newSlugs) {
        await db.runAsync(
          'INSERT OR IGNORE INTO badges (slug, awarded_at) VALUES (?, ?);',
          [slug, now]
        );
      }
    });

    const merged = new Set(alreadyAwarded);
    newSlugs.forEach(s => merged.add(s));
    set({ awarded: merged, justAwarded: newSlugs[newSlugs.length - 1] });

    // Fire a local notification for the most-impressive (last) new badge.
    // No-op on web; native users get a system banner.
    const top = findBadge(newSlugs[newSlugs.length - 1]);
    if (top) {
      presentLocal('Badge unlocked', `${top.glyph} ${top.label}`);
    }

    return newSlugs;
  },

  consumeJustAwarded: () => set({ justAwarded: null }),
}));

// Avoid `dayKey` warning — exported for symmetry with the other stores.
export { dayKey };
