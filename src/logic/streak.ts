/**
 * Streak logic. Pure functions only — store and DB live elsewhere. This
 * makes the rules trivial to unit-test and reason about.
 *
 * Rules:
 *   - First-ever log: streak becomes 1.
 *   - Same day as last_active_day: no change (already counted).
 *   - Exactly one day after last_active_day: streak += 1.
 *   - Otherwise (gap > 1 day): streak resets to 1.
 *   - longest_days = max(longest, current) on every change.
 *
 * We deliberately do NOT decay the streak on read — only writes mutate it.
 * The dashboard "current streak" being stale by a day is the user's signal
 * to log a workout, which is the correct UX nudge anyway.
 */

export interface StreakState {
  currentDays: number;
  longestDays: number;
  lastActiveDay: string | null;   // 'YYYY-MM-DD'
}

/** 'YYYY-MM-DD' string math without Date juggling. */
function addDays(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  // Date is in local TZ; we constructed dayKey in local TZ in client.ts,
  // so this round-trip is consistent.
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function applyStreakLog(state: StreakState, today: string): StreakState {
  if (state.lastActiveDay === today) {
    // Already counted today — no change.
    return state;
  }

  const yesterday = addDays(today, -1);
  const next: StreakState = state.lastActiveDay === yesterday
    ? { ...state, currentDays: state.currentDays + 1, lastActiveDay: today }
    : { ...state, currentDays: 1, lastActiveDay: today };

  if (next.currentDays > next.longestDays) {
    next.longestDays = next.currentDays;
  }
  return next;
}

/**
 * Read-only freshness check used by the HUD. If the user's last active day
 * was before yesterday, the displayed `current_days` is misleading; UI can
 * dim it or show "broken streak" copy.
 */
export function isStreakStale(state: StreakState, today: string): boolean {
  if (!state.lastActiveDay) return false;
  if (state.lastActiveDay === today) return false;
  if (state.lastActiveDay === addDays(today, -1)) return false;
  return true;
}
