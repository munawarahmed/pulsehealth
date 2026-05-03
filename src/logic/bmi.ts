/**
 * BMI calculation + categorization using WHO Asia-Pacific thresholds.
 *
 * The standard WHO global cutoffs (overweight ≥25, obese ≥30) understate
 * cardio-metabolic risk in South Asians. The WHO Expert Consultation
 * (Lancet 2004) recommends lower public-health action points:
 *
 *   < 18.5         Underweight
 *   18.5 – 22.9    Normal
 *   23.0 – 24.9    Overweight (increased risk)
 *   25.0 – 29.9    Obese I (high risk)
 *   ≥ 30.0         Obese II (very high risk)
 *
 * These are the categories PulseHealth surfaces, since the user base is
 * predominantly Pakistani. If you ever need to flip to global WHO, swap the
 * threshold table — the function shape stays the same.
 */

export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_1'
  | 'obese_2';

export interface BmiResult {
  bmi: number;            // kg/m², rounded to 1 dp
  category: BmiCategory;
  label: string;          // human-readable
  riskNote: string;       // short one-liner for HUD
}

const THRESHOLDS: ReadonlyArray<{
  max: number;
  category: BmiCategory;
  label: string;
  riskNote: string;
}> = [
  { max: 18.5, category: 'underweight', label: 'Underweight',
    riskNote: 'Below healthy range — focus on protein and calorie surplus.' },
  { max: 23.0, category: 'normal', label: 'Healthy',
    riskNote: 'Within healthy range for South Asian baseline.' },
  { max: 25.0, category: 'overweight', label: 'Overweight',
    riskNote: 'Increased cardio-metabolic risk. Sustainable deficit recommended.' },
  { max: 30.0, category: 'obese_1', label: 'Obese I',
    riskNote: 'High risk. Consider strength training + structured nutrition.' },
  { max: Infinity, category: 'obese_2', label: 'Obese II',
    riskNote: 'Very high risk. Consult a clinician alongside lifestyle changes.' },
];

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) {
    throw new Error('Invalid weight/height for BMI calculation');
  }
  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  const tier = THRESHOLDS.find(t => bmi < t.max) ?? THRESHOLDS[THRESHOLDS.length - 1];
  return {
    bmi,
    category: tier.category,
    label: tier.label,
    riskNote: tier.riskNote,
  };
}
