import { create } from 'zustand';
import { dayKey, getDb } from '../db/client';
import { macrosForPortion, MealMacros } from '../logic/macros';
import { useBadgeStore } from './badgeStore';

export type FoodCategory =
  | 'breads' | 'rice' | 'curries' | 'lentils'
  | 'snacks' | 'sweets' | 'drinks' | 'sides' | 'protein';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  typicalPortionG: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  healthFlags: string[];
}

export interface LoggedMeal {
  id: number;
  name: string;
  portionG: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: number;
}

interface NutritionState {
  catalog: FoodItem[];
  catalogLoaded: boolean;
  todayTotals: MealMacros;
  todayLogs: LoggedMeal[];

  loadCatalog: () => Promise<void>;
  refreshToday: () => Promise<void>;
  /** Persist a meal log row using a catalog item + portion grams. */
  logMeal: (food: FoodItem, portionG: number) => Promise<void>;
  /** Look a single food up — used by detail/log screens. */
  getFood: (id: string) => Promise<FoodItem | null>;
  /** Match free-text name (from LLM output) to the closest catalog entry. */
  findFoodByName: (name: string) => FoodItem | null;
}

interface FoodRow {
  id: string;
  name: string;
  category: FoodCategory;
  typical_portion_g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  health_flags: string | null;
}

interface MealRow {
  id: number;
  name: string;
  portion_g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: number;
}

function rowToFood(r: FoodRow): FoodItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    typicalPortionG: r.typical_portion_g,
    proteinPer100g: r.protein_per_100g,
    carbsPer100g: r.carbs_per_100g,
    fatPer100g: r.fat_per_100g,
    healthFlags: r.health_flags ? r.health_flags.split(',').filter(Boolean) : [],
  };
}

const ZERO: MealMacros = { proteinG: 0, carbsG: 0, fatG: 0 };

export const useNutritionStore = create<NutritionState>((set, get) => ({
  catalog: [],
  catalogLoaded: false,
  todayTotals: ZERO,
  todayLogs: [],

  loadCatalog: async () => {
    if (get().catalogLoaded) return;
    const db = await getDb();
    const rows = await db.getAllAsync<FoodRow>(
      `SELECT id, name, category, typical_portion_g,
              protein_per_100g, carbs_per_100g, fat_per_100g, health_flags
         FROM food_items
        ORDER BY category ASC, name ASC;`
    );
    set({ catalog: rows.map(rowToFood), catalogLoaded: true });
  },

  refreshToday: async () => {
    const db = await getDb();
    const today = dayKey();
    const rows = await db.getAllAsync<MealRow>(
      `SELECT id, name, portion_g, protein_g, carbs_g, fat_g, logged_at
         FROM meals
        WHERE day_key = ?
        ORDER BY logged_at DESC;`,
      [today]
    );
    const logs: LoggedMeal[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      portionG: r.portion_g,
      proteinG: r.protein_g,
      carbsG: r.carbs_g,
      fatG: r.fat_g,
      loggedAt: r.logged_at,
    }));

    // Sum in JS — for a single day's worth of rows this is dwarfed by the
    // SQLite round-trip we just did.
    const totals = logs.reduce<MealMacros>(
      (acc, m) => ({
        proteinG: acc.proteinG + m.proteinG,
        carbsG:   acc.carbsG + m.carbsG,
        fatG:     acc.fatG + m.fatG,
      }),
      ZERO
    );

    set({ todayLogs: logs, todayTotals: totals });
  },

  logMeal: async (food, portionG) => {
    const db = await getDb();
    const macros = macrosForPortion(food, portionG);
    const now = Date.now();
    const today = dayKey();
    await db.runAsync(
      `INSERT INTO meals
         (name, portion_g, protein_g, carbs_g, fat_g, logged_at, day_key)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [food.name, portionG, macros.proteinG, macros.carbsG, macros.fatG, now, today]
    );
    await get().refreshToday();
    // Meal logs can flip the macros_balanced and meals_10 badges.
    await useBadgeStore.getState().evaluate();
  },

  findFoodByName: (name) => {
    const catalog = get().catalog;
    if (!catalog.length) return null;
    const target = name.trim().toLowerCase();
    // Exact-match first (LLM returns canonical names by design), then a cheap
    // substring fallback so "biryani" resolves to "Chicken Biryani" etc.
    return (
      catalog.find(f => f.name.toLowerCase() === target) ??
      catalog.find(f => f.name.toLowerCase().includes(target)) ??
      catalog.find(f => target.includes(f.name.toLowerCase().split(' ')[0])) ??
      null
    );
  },

  getFood: async (id) => {
    // Cheap path: hit the in-memory catalog if loaded.
    const cached = get().catalog.find(f => f.id === id);
    if (cached) return cached;
    const db = await getDb();
    const row = await db.getFirstAsync<FoodRow>(
      `SELECT id, name, category, typical_portion_g,
              protein_per_100g, carbs_per_100g, fat_per_100g, health_flags
         FROM food_items WHERE id = ?;`,
      [id]
    );
    return row ? rowToFood(row) : null;
  },
}));
