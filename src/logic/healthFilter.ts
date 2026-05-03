/**
 * Map user health conditions to recommended food flags, then rank the
 * catalog so condition-friendly foods surface first. Filtering is a UX
 * choice, not a moral one — we never *hide* foods, just reorder.
 *
 * Adding a condition: extend CONDITION_FLAG_MAP and the UI will pick it up.
 */

export type HealthCondition =
  | 'diabetes'
  | 'hypertension'
  | 'high_cholesterol'
  | 'pcos';

export type HealthFlag =
  | 'low_sodium'
  | 'low_gi'
  | 'high_protein'
  | 'low_fat'
  | 'high_fiber';

const CONDITION_FLAG_MAP: Record<HealthCondition, HealthFlag[]> = {
  diabetes:         ['low_gi', 'high_fiber'],
  hypertension:     ['low_sodium'],
  high_cholesterol: ['low_fat', 'high_fiber'],
  pcos:             ['low_gi', 'high_protein', 'high_fiber'],
};

export function preferredFlagsFor(conditions: string[]): HealthFlag[] {
  const set = new Set<HealthFlag>();
  for (const cond of conditions) {
    const mapped = CONDITION_FLAG_MAP[cond as HealthCondition];
    if (mapped) mapped.forEach(f => set.add(f));
  }
  return Array.from(set);
}

export interface RankableFood {
  healthFlags: string[];   // CSV split into array
}

/**
 * Score a food by how many of the user's preferred flags it carries.
 * Returns 0 for neutral foods. Higher is better.
 */
export function scoreFood(food: RankableFood, preferred: HealthFlag[]): number {
  if (preferred.length === 0) return 0;
  let score = 0;
  for (const flag of preferred) {
    if (food.healthFlags.includes(flag)) score += 1;
  }
  return score;
}

/**
 * Stable sort: highest-scoring foods first; original order preserved within
 * a score bucket. Caller controls whether to actually apply this — useful
 * to toggle "For you" vs raw alphabetic.
 */
export function rankByPreference<T extends RankableFood>(
  foods: T[],
  preferred: HealthFlag[]
): T[] {
  if (preferred.length === 0) return foods;
  return foods
    .map((food, idx) => ({ food, idx, score: scoreFood(food, preferred) }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map(x => x.food);
}
