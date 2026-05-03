/**
 * Badge evaluation. Pure functions only — store/DB layer wires them up.
 *
 * Each badge has:
 *   slug     — stable identifier persisted to SQLite
 *   label    — human-readable
 *   hint     — copy shown on a locked badge to guide the user
 *   glyph    — single emoji/character; replace with proper icons in v0.2
 *   evaluate — pure: given current stats, has the user earned this badge?
 *
 * Adding a badge: append to the list. Evaluation is idempotent — already-
 * unlocked badges aren't re-awarded. Stats come from one round-trip query
 * (see badgeStore.collectStats), so adding more badges doesn't fan out
 * additional SQL.
 */

export interface BadgeStats {
  currentStreakDays: number;
  longestStreakDays: number;
  totalVolumeKg: number;        // Σ sets × reps × weight_kg over all logs
  totalExercisesLogged: number; // count of workout_log rows
  totalMealsLogged: number;     // count of meal rows
  daysWithBalancedMacros: number; // days hitting all 3 macro targets ≥ 80%
}

export interface BadgeDef {
  slug: string;
  label: string;
  hint: string;
  glyph: string;
  evaluate: (stats: BadgeStats) => boolean;
}

export const BADGES: ReadonlyArray<BadgeDef> = [
  // ───── Streaks ─────
  { slug: 'streak_3',  label: 'On the Board',  hint: 'Log workouts 3 days in a row',
    glyph: '🥉', evaluate: s => s.currentStreakDays >= 3 || s.longestStreakDays >= 3 },
  { slug: 'streak_7',  label: 'Week Warrior',  hint: '7-day workout streak',
    glyph: '🔥', evaluate: s => s.currentStreakDays >= 7 || s.longestStreakDays >= 7 },
  { slug: 'streak_30', label: 'Iron Habit',    hint: '30-day workout streak',
    glyph: '🏆', evaluate: s => s.currentStreakDays >= 30 || s.longestStreakDays >= 30 },

  // ───── Volume ─────
  { slug: 'volume_100',   label: 'First Hundred',   hint: 'Lift 100 kg total volume',
    glyph: '💪', evaluate: s => s.totalVolumeKg >= 100 },
  { slug: 'volume_1000',  label: 'One Tonne',       hint: 'Lift 1,000 kg total volume',
    glyph: '🏋️', evaluate: s => s.totalVolumeKg >= 1000 },
  { slug: 'volume_10000', label: 'Ten Tonnes',      hint: 'Lift 10,000 kg total volume',
    glyph: '🦾', evaluate: s => s.totalVolumeKg >= 10000 },

  // ───── Consistency ─────
  { slug: 'meals_10',  label: 'Tracked',       hint: 'Log 10 meals',
    glyph: '🥗', evaluate: s => s.totalMealsLogged >= 10 },
  { slug: 'macros_balanced', label: 'On Target', hint: 'Hit all 3 macro goals in one day',
    glyph: '🎯', evaluate: s => s.daysWithBalancedMacros >= 1 },
];

export function findBadge(slug: string): BadgeDef | undefined {
  return BADGES.find(b => b.slug === slug);
}

/**
 * Given current stats and the slugs already awarded, return the slugs of
 * badges that should be newly awarded. Pure — caller persists.
 */
export function evaluateNewBadges(
  stats: BadgeStats,
  alreadyAwarded: ReadonlySet<string>
): string[] {
  const out: string[] = [];
  for (const b of BADGES) {
    if (alreadyAwarded.has(b.slug)) continue;
    if (b.evaluate(stats)) out.push(b.slug);
  }
  return out;
}
