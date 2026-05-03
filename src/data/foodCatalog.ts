/**
 * Pakistani food catalog. Macros are per 100g of the prepared dish, sourced
 * from public USDA / IFCT-2017 / regional nutrition references and rounded
 * for UI clarity. These are *typical* values — home cooking varies wildly
 * with oil quantity, so treat them as planning estimates, not lab data.
 *
 * Health flag conventions (used by healthFilter.ts):
 *   low_sodium  → < ~140mg per 100g equivalent (suitable for hypertension)
 *   low_gi      → glycemic index < 55 (suitable for diabetes)
 *   high_protein → ≥ 15g protein per 100g (muscle building, satiety)
 *   low_fat     → ≤ 5g fat per 100g (cholesterol-conscious)
 *   high_fiber  → meaningful fiber content (digestion)
 *
 * Foods that lack a flag are NOT being labeled "bad" — they're just neutral
 * for that condition. The UI uses flags to *rank*, not to filter out.
 */

export interface SeedFood {
  id: string;
  name: string;
  category:
    | 'breads' | 'rice' | 'curries' | 'lentils'
    | 'snacks' | 'sweets' | 'drinks' | 'sides' | 'protein';
  typicalPortionG: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  healthFlags: string[];
}

export const SEED_FOODS: ReadonlyArray<SeedFood> = [
  // ───── Breads ─────
  { id: 'food:roti', name: 'Whole Wheat Roti', category: 'breads',
    typicalPortionG: 40, proteinPer100g: 9, carbsPer100g: 55, fatPer100g: 4,
    healthFlags: ['high_fiber'] },
  { id: 'food:naan', name: 'Naan', category: 'breads',
    typicalPortionG: 90, proteinPer100g: 9, carbsPer100g: 56, fatPer100g: 6,
    healthFlags: [] },
  { id: 'food:paratha', name: 'Plain Paratha', category: 'breads',
    typicalPortionG: 80, proteinPer100g: 6, carbsPer100g: 36, fatPer100g: 17,
    healthFlags: [] },
  { id: 'food:aloo-paratha', name: 'Aloo Paratha', category: 'breads',
    typicalPortionG: 110, proteinPer100g: 6, carbsPer100g: 35, fatPer100g: 14,
    healthFlags: [] },

  // ───── Rice ─────
  { id: 'food:basmati', name: 'Basmati Rice (cooked)', category: 'rice',
    typicalPortionG: 150, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3,
    healthFlags: ['low_fat'] },
  { id: 'food:brown-rice', name: 'Brown Rice (cooked)', category: 'rice',
    typicalPortionG: 150, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9,
    healthFlags: ['low_fat', 'low_gi', 'high_fiber'] },
  { id: 'food:chicken-biryani', name: 'Chicken Biryani', category: 'rice',
    typicalPortionG: 250, proteinPer100g: 9, carbsPer100g: 26, fatPer100g: 7,
    healthFlags: [] },
  { id: 'food:pulao', name: 'Chicken Pulao', category: 'rice',
    typicalPortionG: 220, proteinPer100g: 8, carbsPer100g: 28, fatPer100g: 6,
    healthFlags: [] },

  // ───── Lentils ─────
  { id: 'food:daal-masoor', name: 'Daal Masoor (red lentil)', category: 'lentils',
    typicalPortionG: 200, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4,
    healthFlags: ['low_fat', 'low_gi', 'high_fiber', 'low_sodium'] },
  { id: 'food:daal-chana', name: 'Daal Chana', category: 'lentils',
    typicalPortionG: 200, proteinPer100g: 8, carbsPer100g: 20, fatPer100g: 4,
    healthFlags: ['low_gi', 'high_fiber'] },
  { id: 'food:daal-mash', name: 'Daal Mash (urad)', category: 'lentils',
    typicalPortionG: 200, proteinPer100g: 9, carbsPer100g: 19, fatPer100g: 3,
    healthFlags: ['low_gi', 'high_fiber'] },
  { id: 'food:chana-masala', name: 'Chana Masala', category: 'lentils',
    typicalPortionG: 200, proteinPer100g: 9, carbsPer100g: 22, fatPer100g: 5,
    healthFlags: ['high_fiber', 'low_gi'] },

  // ───── Curries / Mains ─────
  { id: 'food:chicken-karahi', name: 'Chicken Karahi', category: 'curries',
    typicalPortionG: 250, proteinPer100g: 22, carbsPer100g: 4, fatPer100g: 9,
    healthFlags: ['high_protein', 'low_gi'] },
  { id: 'food:chicken-handi', name: 'Chicken Handi', category: 'curries',
    typicalPortionG: 250, proteinPer100g: 20, carbsPer100g: 5, fatPer100g: 12,
    healthFlags: ['high_protein'] },
  { id: 'food:beef-nihari', name: 'Beef Nihari', category: 'curries',
    typicalPortionG: 250, proteinPer100g: 20, carbsPer100g: 6, fatPer100g: 16,
    healthFlags: ['high_protein'] },
  { id: 'food:haleem', name: 'Haleem', category: 'curries',
    typicalPortionG: 250, proteinPer100g: 13, carbsPer100g: 16, fatPer100g: 12,
    healthFlags: ['high_fiber'] },
  { id: 'food:keema', name: 'Beef Keema', category: 'curries',
    typicalPortionG: 200, proteinPer100g: 22, carbsPer100g: 3, fatPer100g: 14,
    healthFlags: ['high_protein', 'low_gi'] },
  { id: 'food:mutton-korma', name: 'Mutton Korma', category: 'curries',
    typicalPortionG: 220, proteinPer100g: 18, carbsPer100g: 5, fatPer100g: 22,
    healthFlags: ['high_protein'] },
  { id: 'food:palak-paneer', name: 'Palak Paneer', category: 'curries',
    typicalPortionG: 200, proteinPer100g: 9, carbsPer100g: 8, fatPer100g: 15,
    healthFlags: ['low_gi'] },

  // ───── Sides / Sabzi ─────
  { id: 'food:aloo-sabzi', name: 'Aloo Sabzi', category: 'sides',
    typicalPortionG: 180, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 5,
    healthFlags: [] },
  { id: 'food:bhindi', name: 'Bhindi (Okra)', category: 'sides',
    typicalPortionG: 180, proteinPer100g: 2, carbsPer100g: 8, fatPer100g: 4,
    healthFlags: ['low_gi', 'high_fiber'] },
  { id: 'food:saag', name: 'Sarson Ka Saag', category: 'sides',
    typicalPortionG: 200, proteinPer100g: 3, carbsPer100g: 7, fatPer100g: 4,
    healthFlags: ['low_gi', 'high_fiber'] },

  // ───── Protein staples ─────
  { id: 'food:egg-boiled', name: 'Egg (boiled)', category: 'protein',
    typicalPortionG: 50, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11,
    healthFlags: ['high_protein', 'low_gi', 'low_sodium'] },
  { id: 'food:yogurt', name: 'Plain Yogurt (Dahi)', category: 'protein',
    typicalPortionG: 150, proteinPer100g: 3.5, carbsPer100g: 5, fatPer100g: 3,
    healthFlags: ['low_gi', 'low_sodium'] },
  { id: 'food:chicken-grilled', name: 'Grilled Chicken Breast', category: 'protein',
    typicalPortionG: 150, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6,
    healthFlags: ['high_protein', 'low_fat', 'low_gi', 'low_sodium'] },

  // ───── Snacks ─────
  { id: 'food:samosa', name: 'Samosa', category: 'snacks',
    typicalPortionG: 70, proteinPer100g: 5, carbsPer100g: 24, fatPer100g: 17,
    healthFlags: [] },
  { id: 'food:pakora', name: 'Pakora', category: 'snacks',
    typicalPortionG: 80, proteinPer100g: 8, carbsPer100g: 25, fatPer100g: 20,
    healthFlags: [] },
  { id: 'food:chana-chaat', name: 'Chana Chaat', category: 'snacks',
    typicalPortionG: 150, proteinPer100g: 8, carbsPer100g: 22, fatPer100g: 4,
    healthFlags: ['high_fiber', 'low_gi'] },

  // ───── Sweets ─────
  { id: 'food:gulab-jamun', name: 'Gulab Jamun', category: 'sweets',
    typicalPortionG: 70, proteinPer100g: 5, carbsPer100g: 45, fatPer100g: 13,
    healthFlags: [] },
  { id: 'food:kheer', name: 'Kheer', category: 'sweets',
    typicalPortionG: 150, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 6,
    healthFlags: [] },

  // ───── Drinks ─────
  { id: 'food:lassi-sweet', name: 'Sweet Lassi', category: 'drinks',
    typicalPortionG: 250, proteinPer100g: 2.2, carbsPer100g: 8, fatPer100g: 1.6,
    healthFlags: [] },
  { id: 'food:lassi-salty', name: 'Salty Lassi', category: 'drinks',
    typicalPortionG: 250, proteinPer100g: 2.5, carbsPer100g: 4, fatPer100g: 1.8,
    healthFlags: ['low_gi'] },
  { id: 'food:milk-whole', name: 'Whole Milk', category: 'drinks',
    typicalPortionG: 200, proteinPer100g: 3.2, carbsPer100g: 5, fatPer100g: 3.5,
    healthFlags: ['low_gi', 'low_sodium'] },
];
