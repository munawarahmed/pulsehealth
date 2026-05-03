import { dailyGoalsFor, kcalOf, macrosForPortion } from '../src/logic/macros';

describe('dailyGoalsFor', () => {
  test('70kg adult → ~2156 kcal estimate', () => {
    const g = dailyGoalsFor(70);
    // 22 * 70 * 1.4 = 2156
    expect(g.kcal).toBe(2156);
    // 30/45/25 split
    expect(g.proteinG).toBe(Math.round(2156 * 0.30 / 4));
    expect(g.carbsG).toBe(Math.round(2156 * 0.45 / 4));
    expect(g.fatG).toBe(Math.round(2156 * 0.25 / 9));
  });

  test('lighter user gets lower goals', () => {
    const a = dailyGoalsFor(50);
    const b = dailyGoalsFor(90);
    expect(a.kcal).toBeLessThan(b.kcal);
    expect(a.proteinG).toBeLessThan(b.proteinG);
  });

  test('macro grams roughly add to kcal target', () => {
    const g = dailyGoalsFor(75);
    const reconstructed = g.proteinG * 4 + g.carbsG * 4 + g.fatG * 9;
    // Rounding loss is small.
    expect(Math.abs(reconstructed - g.kcal)).toBeLessThan(5);
  });
});

describe('macrosForPortion', () => {
  const roti = { proteinPer100g: 9, carbsPer100g: 55, fatPer100g: 4 };

  test('100g returns the per-100g values', () => {
    expect(macrosForPortion(roti, 100)).toEqual({ proteinG: 9, carbsG: 55, fatG: 4 });
  });

  test('40g (typical roti) scales linearly', () => {
    const m = macrosForPortion(roti, 40);
    expect(m.proteinG).toBeCloseTo(3.6, 1);
    expect(m.carbsG).toBeCloseTo(22, 1);
    expect(m.fatG).toBeCloseTo(1.6, 1);
  });

  test('rounds to 1 decimal place', () => {
    const m = macrosForPortion(roti, 33);
    expect(Number.isInteger(m.proteinG * 10)).toBe(true);
    expect(Number.isInteger(m.carbsG * 10)).toBe(true);
    expect(Number.isInteger(m.fatG * 10)).toBe(true);
  });

  test('zero portion returns zeros', () => {
    expect(macrosForPortion(roti, 0)).toEqual({ proteinG: 0, carbsG: 0, fatG: 0 });
  });
});

describe('kcalOf', () => {
  test('protein 4, carbs 4, fat 9', () => {
    expect(kcalOf({ proteinG: 10, carbsG: 0, fatG: 0 })).toBe(40);
    expect(kcalOf({ proteinG: 0, carbsG: 10, fatG: 0 })).toBe(40);
    expect(kcalOf({ proteinG: 0, carbsG: 0, fatG: 10 })).toBe(90);
  });

  test('combined macros sum correctly', () => {
    expect(kcalOf({ proteinG: 30, carbsG: 50, fatG: 20 })).toBe(30 * 4 + 50 * 4 + 20 * 9);
  });
});
