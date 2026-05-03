import { calculateBmi } from '../src/logic/bmi';

describe('calculateBmi (WHO Asia-Pacific thresholds)', () => {
  test('underweight: 50kg / 175cm → BMI 16.3, "underweight"', () => {
    const r = calculateBmi(50, 175);
    expect(r.bmi).toBeCloseTo(16.3, 1);
    expect(r.category).toBe('underweight');
  });

  test('normal: 65kg / 175cm → BMI 21.2, "normal"', () => {
    const r = calculateBmi(65, 175);
    expect(r.bmi).toBeCloseTo(21.2, 1);
    expect(r.category).toBe('normal');
  });

  test('Asia-Pacific cutoff: 23.0 is overweight, 22.9 is still normal', () => {
    // 70.0kg / 175cm → BMI 22.857 → rounds to 22.9 → still normal
    const justUnder = calculateBmi(70.0, 175);
    expect(justUnder.bmi).toBeCloseTo(22.9, 1);
    expect(justUnder.category).toBe('normal');

    // 70.5kg / 175cm → BMI 23.02 → rounds to 23.0 → overweight
    const justOver = calculateBmi(70.5, 175);
    expect(justOver.bmi).toBeCloseTo(23.0, 1);
    expect(justOver.category).toBe('overweight');
  });

  test('obese_1: BMI 25.0 maps to obese_1 (Asia-Pacific)', () => {
    // 76.6kg / 175cm → BMI 25.01 → obese_1 (not overweight)
    const r = calculateBmi(76.6, 175);
    expect(r.category).toBe('obese_1');
  });

  test('obese_2: BMI ≥ 30', () => {
    const r = calculateBmi(95, 175);
    expect(r.category).toBe('obese_2');
  });

  test('throws on invalid input', () => {
    expect(() => calculateBmi(NaN, 175)).toThrow();
    expect(() => calculateBmi(70, 0)).toThrow();
    expect(() => calculateBmi(70, -10)).toThrow();
  });

  test('returns 1-decimal rounded BMI', () => {
    const r = calculateBmi(70, 175);
    expect(Number.isInteger(r.bmi * 10)).toBe(true);
  });
});
