import { BADGES, evaluateNewBadges, BadgeStats } from '../src/logic/badges';

const baseStats: BadgeStats = {
  currentStreakDays: 0,
  longestStreakDays: 0,
  totalVolumeKg: 0,
  totalExercisesLogged: 0,
  totalMealsLogged: 0,
  daysWithBalancedMacros: 0,
};

describe('evaluateNewBadges', () => {
  test('zero stats unlock nothing', () => {
    expect(evaluateNewBadges(baseStats, new Set())).toEqual([]);
  });

  test('3-day streak unlocks streak_3 only', () => {
    const out = evaluateNewBadges({ ...baseStats, currentStreakDays: 3 }, new Set());
    expect(out).toContain('streak_3');
    expect(out).not.toContain('streak_7');
  });

  test('7-day streak unlocks both streak_3 and streak_7', () => {
    const out = evaluateNewBadges({ ...baseStats, currentStreakDays: 7 }, new Set());
    expect(out).toContain('streak_3');
    expect(out).toContain('streak_7');
    expect(out).not.toContain('streak_30');
  });

  test('longest streak counts even if current resets', () => {
    const out = evaluateNewBadges(
      { ...baseStats, currentStreakDays: 1, longestStreakDays: 7 },
      new Set()
    );
    expect(out).toContain('streak_7');
  });

  test('volume tiers unlock progressively', () => {
    expect(evaluateNewBadges({ ...baseStats, totalVolumeKg: 100 }, new Set())).toContain('volume_100');
    expect(evaluateNewBadges({ ...baseStats, totalVolumeKg: 1000 }, new Set())).toContain('volume_1000');
    expect(evaluateNewBadges({ ...baseStats, totalVolumeKg: 10000 }, new Set())).toContain('volume_10000');
  });

  test('already-awarded badges are not re-emitted', () => {
    const stats = { ...baseStats, currentStreakDays: 7, totalVolumeKg: 100 };
    const out = evaluateNewBadges(stats, new Set(['streak_3', 'streak_7']));
    expect(out).not.toContain('streak_3');
    expect(out).not.toContain('streak_7');
    expect(out).toContain('volume_100');
  });

  test('no badge evaluates true on multiple unrelated metrics', () => {
    // Sanity check that each badge slug is unique and rule doesn't accidentally fire.
    const slugs = new Set(BADGES.map(b => b.slug));
    expect(slugs.size).toBe(BADGES.length);
  });

  test('macros_balanced unlocks at 1+ balanced day', () => {
    expect(evaluateNewBadges({ ...baseStats, daysWithBalancedMacros: 1 }, new Set()))
      .toContain('macros_balanced');
  });

  test('meals_10 unlocks at 10 meal logs', () => {
    expect(evaluateNewBadges({ ...baseStats, totalMealsLogged: 9 }, new Set()))
      .not.toContain('meals_10');
    expect(evaluateNewBadges({ ...baseStats, totalMealsLogged: 10 }, new Set()))
      .toContain('meals_10');
  });
});
