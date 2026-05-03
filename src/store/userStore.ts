import { create } from 'zustand';
import { getDb } from '../db/client';
import { calculateBmi, BmiResult } from '../logic/bmi';

export interface UserProfile {
  id: 1;
  name: string;
  age: number;
  weightKg: number;
  heightCm: number;
  healthConditions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface OnboardingInput {
  name: string;
  age: number;
  weightKg: number;
  heightCm: number;
  healthConditions?: string[];
}

interface UserState {
  user: UserProfile | null;
  bmi: BmiResult | null;
  hydrated: boolean;          // true once we've checked the DB on launch
  hydrate: () => Promise<void>;
  saveOnboarding: (input: OnboardingInput) => Promise<void>;
}

interface UserRow {
  id: number;
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  health_conditions: string | null;
  created_at: number;
  updated_at: number;
}

function rowToProfile(r: UserRow): UserProfile {
  return {
    id: 1,
    name: r.name,
    age: r.age,
    weightKg: r.weight_kg,
    heightCm: r.height_cm,
    healthConditions: r.health_conditions ? r.health_conditions.split(',').filter(Boolean) : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  bmi: null,
  hydrated: false,

  hydrate: async () => {
    const db = await getDb();
    const row = await db.getFirstAsync<UserRow>(
      'SELECT * FROM users WHERE id = 1;'
    );
    if (row) {
      const user = rowToProfile(row);
      set({ user, bmi: calculateBmi(user.weightKg, user.heightCm), hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },

  saveOnboarding: async (input) => {
    const db = await getDb();
    const now = Date.now();
    const conditions = (input.healthConditions ?? []).join(',');

    // INSERT OR REPLACE keeps id=1 invariant; createdAt preserved if existing.
    await db.runAsync(
      `INSERT INTO users (id, name, age, weight_kg, height_cm, health_conditions, created_at, updated_at)
       VALUES (1, ?, ?, ?, ?, ?,
               COALESCE((SELECT created_at FROM users WHERE id = 1), ?),
               ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         age = excluded.age,
         weight_kg = excluded.weight_kg,
         height_cm = excluded.height_cm,
         health_conditions = excluded.health_conditions,
         updated_at = excluded.updated_at;`,
      [input.name, input.age, input.weightKg, input.heightCm, conditions, now, now]
    );

    const user: UserProfile = {
      id: 1,
      name: input.name,
      age: input.age,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      healthConditions: input.healthConditions ?? [],
      createdAt: now,
      updatedAt: now,
    };
    set({ user, bmi: calculateBmi(user.weightKg, user.heightCm) });
  },
}));
