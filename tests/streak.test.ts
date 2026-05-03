import { applyStreakLog, isStreakStale, StreakState } from '../src/logic/streak';

const empty: StreakState = { currentDays: 0, longestDays: 0, lastActiveDay: null };

describe('applyStreakLog', () => {
  test('first-ever log starts streak at 1', () => {
    const next = applyStreakLog(empty, '2026-05-03');
    expect(next.currentDays).toBe(1);
    expect(next.longestDays).toBe(1);
    expect(next.lastActiveDay).toBe('2026-05-03');
  });

  test('same-day log is a no-op', () => {
    const start: StreakState = { currentDays: 5, longestDays: 5, lastActiveDay: '2026-05-03' };
    const next = applyStreakLog(start, '2026-05-03');
    expect(next).toEqual(start);
  });

  test('next-day log increments', () => {
    const start: StreakState = { currentDays: 5, longestDays: 5, lastActiveDay: '2026-05-02' };
    const next = applyStreakLog(start, '2026-05-03');
    expect(next.currentDays).toBe(6);
    expect(next.longestDays).toBe(6);
    expect(next.lastActiveDay).toBe('2026-05-03');
  });

  test('gap of 2 days resets to 1 but keeps longest', () => {
    const start: StreakState = { currentDays: 12, longestDays: 12, lastActiveDay: '2026-05-01' };
    const next = applyStreakLog(start, '2026-05-04');
    expect(next.currentDays).toBe(1);
    expect(next.longestDays).toBe(12);
    expect(next.lastActiveDay).toBe('2026-05-04');
  });

  test('handles month boundaries', () => {
    const start: StreakState = { currentDays: 3, longestDays: 3, lastActiveDay: '2026-04-30' };
    const next = applyStreakLog(start, '2026-05-01');
    expect(next.currentDays).toBe(4);
  });

  test('handles year boundaries', () => {
    const start: StreakState = { currentDays: 100, longestDays: 100, lastActiveDay: '2025-12-31' };
    const next = applyStreakLog(start, '2026-01-01');
    expect(next.currentDays).toBe(101);
    expect(next.longestDays).toBe(101);
  });
});

describe('isStreakStale', () => {
  test('today is not stale', () => {
    expect(isStreakStale(
      { currentDays: 5, longestDays: 5, lastActiveDay: '2026-05-03' },
      '2026-05-03'
    )).toBe(false);
  });

  test('yesterday is not stale', () => {
    expect(isStreakStale(
      { currentDays: 5, longestDays: 5, lastActiveDay: '2026-05-02' },
      '2026-05-03'
    )).toBe(false);
  });

  test('two days ago IS stale', () => {
    expect(isStreakStale(
      { currentDays: 5, longestDays: 5, lastActiveDay: '2026-05-01' },
      '2026-05-03'
    )).toBe(true);
  });

  test('null lastActiveDay is not stale (no streak yet)', () => {
    expect(isStreakStale(empty, '2026-05-03')).toBe(false);
  });
});
