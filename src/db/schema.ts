/**
 * SQLite schema — offline-first source of truth.
 *
 * Versioning rule: NEVER mutate an existing CREATE TABLE. Add a migration step
 * to MIGRATIONS keyed by the next integer. The runner stores user_version in
 * SQLite's PRAGMA, so additive migrations replay exactly once.
 */

export const SCHEMA_VERSION = 4;

/** v1 — Sprint 1 foundation. Tables for sprints 2–4 are stubbed out so the
 *  layout is committed early and we don't churn FKs later. */
export const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY CHECK (id = 1),  -- single-user app, enforce
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL NOT NULL,
      health_conditions TEXT,                 -- CSV: 'diabetes,hypertension'
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id TEXT NOT NULL,              -- ExerciseDB / Wger id
      muscle_group TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL,
      logged_at INTEGER NOT NULL,             -- unix ms
      day_key TEXT NOT NULL                   -- 'YYYY-MM-DD' for streak grouping
    );`,
    `CREATE INDEX IF NOT EXISTS idx_workout_day ON workout_logs(day_key);`,

    `CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,                     -- 'Daal Chawal', 'Chicken Karahi'
      portion_g REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      logged_at INTEGER NOT NULL,
      day_key TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_meal_day ON meals(day_key);`,

    `CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_days INTEGER NOT NULL DEFAULT 0,
      longest_days INTEGER NOT NULL DEFAULT 0,
      last_active_day TEXT                    -- 'YYYY-MM-DD' or NULL
    );`,
  ],

  /** v2 — Sprint 2: exercise library cache. Seeded from bundled data on first
   *  install so the app is fully usable offline. Network-fetched exercises
   *  upsert into the same table by `id`. */
  2: [
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,                    -- 'seed:bench-press' or 'wger:192'
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,             -- canonical group slug
      description TEXT NOT NULL,              -- form cues
      image_url TEXT,                         -- nullable; seed entries have none
      source TEXT NOT NULL,                   -- 'seed' | 'wger' | 'exercisedb'
      updated_at INTEGER NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises(muscle_group);`,
  ],

  /** v3 — Sprint 3: Pakistani food catalog. Macros stored per 100g (portion
   *  math happens at log-time). health_flags is CSV of tags like
   *  'low_sodium,low_gi,high_protein' — used to rank suggestions for users
   *  with conditions like hypertension or diabetes. */
  3: [
    `CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,                -- 'food:roti', 'food:nihari'
      name TEXT NOT NULL,
      category TEXT NOT NULL,             -- 'breads' | 'rice' | 'curries' | 'lentils' | 'snacks' | 'sweets' | 'drinks' | 'sides'
      typical_portion_g REAL NOT NULL,    -- default portion shown in UI
      protein_per_100g REAL NOT NULL,
      carbs_per_100g REAL NOT NULL,
      fat_per_100g REAL NOT NULL,
      health_flags TEXT,                  -- CSV of flags (nullable)
      source TEXT NOT NULL DEFAULT 'seed',
      updated_at INTEGER NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);`,
  ],

  /** v4 — Sprint 4: Engagement layer. Two tables:
   *
   *  `badges` records milestones the user has unlocked. Slug is the stable
   *  identifier (defined in logic/badges.ts); awarded_at is the unlock time.
   *  We store one row per slug — re-evaluation is idempotent.
   *
   *  `app_settings` is the singleton row for user preferences, currently
   *  just gym-reminder configuration. Separate from `users` so changing a
   *  preference doesn't bump the profile updated_at. */
  4: [
    `CREATE TABLE IF NOT EXISTS badges (
      slug TEXT PRIMARY KEY,
      awarded_at INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      gym_reminder_enabled INTEGER NOT NULL DEFAULT 0,
      gym_reminder_hour INTEGER NOT NULL DEFAULT 18,
      gym_reminder_minute INTEGER NOT NULL DEFAULT 0,
      gym_reminder_notif_id TEXT
    );`,
  ],
};
