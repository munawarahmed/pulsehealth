import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';
import { SEED_EXERCISES } from '../data/seedExercises';
import { SEED_FOODS } from '../data/foodCatalog';

/**
 * Singleton DB handle. expo-sqlite's new async API serializes writes per
 * connection, so we keep one connection app-wide and reuse it.
 */
let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('pulsehealth.db');
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(_db);
  return _db;
}

/**
 * Post-migration data hooks. Keyed by schema version — each runs exactly
 * once, inside the same transaction that bumps user_version. Use these for
 * bundled seed data that's awkward to express as raw SQL strings.
 */
const POST_MIGRATIONS: Record<number, (db: SQLite.SQLiteDatabase) => Promise<void>> = {
  2: async (db) => {
    // INSERT OR IGNORE keeps this idempotent — re-running the seed (e.g.
    // after a manual rollback) won't clobber any user-fetched Wger entries.
    const now = Date.now();
    for (const ex of SEED_EXERCISES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises
           (id, name, muscle_group, description, image_url, source, updated_at)
         VALUES (?, ?, ?, ?, NULL, 'seed', ?);`,
        [ex.id, ex.name, ex.muscleGroup, ex.description, now]
      );
    }
  },

  3: async (db) => {
    const now = Date.now();
    for (const f of SEED_FOODS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO food_items
           (id, name, category, typical_portion_g,
            protein_per_100g, carbs_per_100g, fat_per_100g,
            health_flags, source, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'seed', ?);`,
        [
          f.id, f.name, f.category, f.typicalPortionG,
          f.proteinPer100g, f.carbsPer100g, f.fatPer100g,
          f.healthFlags.join(','), now,
        ]
      );
    }
  },
};

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const current = row?.user_version ?? 0;

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const steps = MIGRATIONS[v];
    if (!steps) continue;
    // Each migration runs in its own transaction so a partial failure rolls
    // back to a known version rather than leaving the DB half-migrated.
    await db.withTransactionAsync(async () => {
      for (const sql of steps) {
        await db.execAsync(sql);
      }
      const post = POST_MIGRATIONS[v];
      if (post) await post(db);
      await db.execAsync(`PRAGMA user_version = ${v};`);
    });
  }
}

/** Convenience: today's day_key in local TZ as 'YYYY-MM-DD'. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
