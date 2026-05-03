/**
 * Macro math — all pure. The store layer wires these to SQLite values.
 *
 * Daily goals derivation is intentionally rough: we don't have sex on the
 * profile (Sprint 1 didn't collect it) and TDEE for non-athletes is dominated
 * by activity multipliers we'd be guessing anyway. We use:
 *
 *   TDEE_kcal ≈ 22 × weight_kg × 1.4   (lightly active, sex-neutral estimate)
 *
 * This sits between the male and female Mifflin-St Jeor outputs for typical
 * adults (within ~10%). For a goals-bar UI that's tolerable. If a future
 * sprint adds `sex` to the profile, swap to the proper Mifflin formula in
 * one place.
 *
 * Macro split: 30% protein, 45% carbs, 25% fat — sensible default for an
 * active gym user. A real product would let the user override; we don't yet.
 */

export interface DailyMacroGoal {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealMacros {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const PROTEIN_KCAL_PER_G = 4;
const CARB_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

const PROTEIN_SPLIT = 0.30;
const CARB_SPLIT = 0.45;
const FAT_SPLIT = 0.25;

export function dailyGoalsFor(weightKg: number): DailyMacroGoal {
  const tdee = Math.round(22 * weightKg * 1.4);
  return {
    kcal: tdee,
    proteinG: Math.round((tdee * PROTEIN_SPLIT) / PROTEIN_KCAL_PER_G),
    carbsG:   Math.round((tdee * CARB_SPLIT) / CARB_KCAL_PER_G),
    fatG:     Math.round((tdee * FAT_SPLIT) / FAT_KCAL_PER_G),
  };
}

/**
 * Convert per-100g catalog macros to a logged-meal macro count for an
 * arbitrary portion. Rounding to 1 dp keeps the UI clean without losing
 * meaningful precision.
 */
export function macrosForPortion(
  per100g: { proteinPer100g: number; carbsPer100g: number; fatPer100g: number },
  portionG: number
): MealMacros {
  const ratio = portionG / 100;
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    proteinG: round(per100g.proteinPer100g * ratio),
    carbsG:   round(per100g.carbsPer100g * ratio),
    fatG:     round(per100g.fatPer100g * ratio),
  };
}

export function kcalOf(m: MealMacros): number {
  return Math.round(
    m.proteinG * PROTEIN_KCAL_PER_G +
    m.carbsG * CARB_KCAL_PER_G +
    m.fatG * FAT_KCAL_PER_G
  );
}
