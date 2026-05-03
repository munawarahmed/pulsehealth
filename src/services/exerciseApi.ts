/**
 * Wger exercise API adapter. Free, no API key required.
 * Docs: https://wger.de/api/v2/
 *
 * The adapter is intentionally pure: it returns normalized records, never
 * touches SQLite. The workout store is responsible for upserting cache rows.
 * That separation keeps it swap-friendly — replacing Wger with ExerciseDB
 * (or anything else) only changes this file.
 */

import { MUSCLE_GROUPS, MuscleGroupSlug } from '../logic/muscleGroups';

export interface NormalizedExercise {
  id: string;            // 'wger:<id>'
  name: string;
  muscleGroup: MuscleGroupSlug;
  description: string;
  imageUrl: string | null;
  source: 'wger';
}

const WGER_BASE = 'https://wger.de/api/v2';

/** Strip Wger's HTML description down to plain text. */
function stripHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

interface WgerExerciseInfo {
  id: number;
  name: string;
  description: string;
  language: { id: number; short_name: string };
  muscles: Array<{ id: number }>;
  category: { id: number };
  images?: Array<{ image: string; is_main: boolean }>;
}

interface WgerListResponse<T> {
  count: number;
  next: string | null;
  results: T[];
}

/**
 * Fetch exercises for a muscle group. Single page, English-only, capped
 * because the spec is "augment the seed library" — not "download everything".
 */
export async function fetchExercisesForGroup(
  slug: MuscleGroupSlug,
  opts: { limit?: number; signal?: AbortSignal } = {}
): Promise<NormalizedExercise[]> {
  const group = MUSCLE_GROUPS.find(g => g.slug === slug);
  if (!group) throw new Error(`Unknown muscle group: ${slug}`);

  const params = new URLSearchParams({
    language: '2',                    // English
    limit: String(opts.limit ?? 20),
    status: '2',                       // Approved only
  });

  if (group.wgerCategoryId !== undefined) {
    params.set('category', String(group.wgerCategoryId));
  } else if (group.wgerMuscleIds.length > 0) {
    // Wger filters by single muscle id; we pick the primary one for the
    // group and post-filter client-side if needed.
    params.set('muscles', String(group.wgerMuscleIds[0]));
  }

  const url = `${WGER_BASE}/exerciseinfo/?${params.toString()}`;
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) {
    throw new Error(`Wger fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as WgerListResponse<WgerExerciseInfo>;

  return data.results
    .filter(e => e.language?.short_name === 'en' || e.language?.id === 2)
    .map(e => normalize(e, slug))
    .filter((e): e is NormalizedExercise => e !== null);
}

function normalize(
  e: WgerExerciseInfo,
  slug: MuscleGroupSlug
): NormalizedExercise | null {
  if (!e.name || !e.id) return null;
  const main = e.images?.find(i => i.is_main) ?? e.images?.[0];
  return {
    id: `wger:${e.id}`,
    name: e.name,
    muscleGroup: slug,
    description: stripHtml(e.description) || 'No description provided.',
    imageUrl: main?.image ?? null,
    source: 'wger',
  };
}
