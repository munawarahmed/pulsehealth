/**
 * Web fallback for db/client.ts. Metro auto-resolves `.web.ts` extensions
 * for the web target, so this file is bundled instead of client.ts when
 * running in the browser.
 *
 * expo-sqlite v14 ships only a "throws Unimplemented" web stub. We work
 * around that with sql.js — real SQLite compiled to WASM, in-memory, with
 * localStorage persistence between page loads. The adapter exposes the
 * same async surface the rest of the app expects (execAsync / runAsync /
 * getFirstAsync / getAllAsync / withTransactionAsync), so caller code is
 * identical on native and web.
 *
 * Caveats:
 *   - sql.js is single-threaded and synchronous internally; the async
 *     wrappers exist only so call sites stay platform-agnostic.
 *   - We persist after every write by exporting the whole DB and base64-
 *     encoding it to localStorage. Fine for a personal-scale offline app;
 *     a larger dataset would warrant IndexedDB chunking.
 *   - WAL pragma is silently ignored (sql.js doesn't support it).
 */

// sql.js ships a `browser` field in package.json that points to a non-modular
// `<script>`-style global. Metro picks that up for web and our default import
// resolves to `undefined`. Importing the explicit dist path bypasses the
// browser-field substitution and gives us the proper `module.exports`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs: typeof import('sql.js').default = require('sql.js/dist/sql-wasm.js');
import type { Database } from 'sql.js';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';
import { SEED_EXERCISES } from '../data/seedExercises';
import { SEED_FOODS } from '../data/foodCatalog';

const STORAGE_KEY = 'pulsehealth.db.v1';
const WASM_CDN = 'https://sql.js.org/dist';

interface SQLiteShim {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: any[]) => Promise<void>;
  getFirstAsync: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
  getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  withTransactionAsync: (fn: () => Promise<void>) => Promise<void>;
}

let _shim: SQLiteShim | null = null;
let _ready: Promise<SQLiteShim> | null = null;

// ─────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────

function loadSavedBytes(): Uint8Array | null {
  try {
    const b64 = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!b64) return null;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function persist(db: Database) {
  try {
    if (typeof localStorage === 'undefined') return;
    const bytes = db.export();
    let bin = '';
    // Build base64 string in chunks to avoid call-stack overflow on big DBs.
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
    }
    localStorage.setItem(STORAGE_KEY, btoa(bin));
  } catch (e) {
    // Persistence is best-effort; never let it break a write.
    // eslint-disable-next-line no-console
    console.warn('[client.web] persist failed', e);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Shim factory
// ─────────────────────────────────────────────────────────────────────

function buildShim(db: Database): SQLiteShim {
  return {
    async execAsync(sql) {
      // exec() handles multi-statement strings; run() handles single.
      // We use exec for safety since some migrations may concat.
      db.exec(sql);
      persist(db);
    },
    async runAsync(sql, params = []) {
      db.run(sql, params);
      persist(db);
    },
    async getFirstAsync<T>(sql: string, params: any[] = []): Promise<T | null> {
      const stmt = db.prepare(sql);
      try {
        if (params.length) stmt.bind(params);
        if (stmt.step()) return stmt.getAsObject() as unknown as T;
        return null;
      } finally {
        stmt.free();
      }
    },
    async getAllAsync<T>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      try {
        if (params.length) stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as unknown as T);
        return rows;
      } finally {
        stmt.free();
      }
    },
    async withTransactionAsync(fn) {
      db.run('BEGIN');
      try {
        await fn();
        db.run('COMMIT');
        persist(db);
      } catch (e) {
        db.run('ROLLBACK');
        throw e;
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Migrations (mirrors native client.ts)
// ─────────────────────────────────────────────────────────────────────

const POST_MIGRATIONS: Record<number, (s: SQLiteShim) => Promise<void>> = {
  2: async (s) => {
    const now = Date.now();
    for (const ex of SEED_EXERCISES) {
      await s.runAsync(
        `INSERT OR IGNORE INTO exercises
           (id, name, muscle_group, description, image_url, source, updated_at)
         VALUES (?, ?, ?, ?, NULL, 'seed', ?);`,
        [ex.id, ex.name, ex.muscleGroup, ex.description, now]
      );
    }
  },
  3: async (s) => {
    const now = Date.now();
    for (const f of SEED_FOODS) {
      await s.runAsync(
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

async function runMigrations(s: SQLiteShim): Promise<void> {
  const row = await s.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const current = row?.user_version ?? 0;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const steps = MIGRATIONS[v];
    if (!steps) continue;
    await s.withTransactionAsync(async () => {
      for (const sql of steps) await s.execAsync(sql);
      const post = POST_MIGRATIONS[v];
      if (post) await post(s);
      await s.execAsync(`PRAGMA user_version = ${v};`);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export async function getDb(): Promise<SQLiteShim> {
  if (_shim) return _shim;
  if (_ready) return _ready;

  _ready = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `${WASM_CDN}/${file}`,
    });
    const saved = loadSavedBytes();
    const db = saved ? new SQL.Database(saved) : new SQL.Database();
    try { db.run('PRAGMA foreign_keys = ON;'); } catch { /* sql.js: ok */ }
    const shim = buildShim(db);
    await runMigrations(shim);
    _shim = shim;
    return shim;
  })();

  return _ready;
}

/** 'YYYY-MM-DD' in local TZ — same impl as native. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
