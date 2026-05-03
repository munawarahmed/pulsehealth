/**
 * Token-saving LLM middleware.
 *
 * Spec calls for a "Structured Snippet" approach: never send the full user
 * profile or chat history; send only the operation + the minimum delta needed
 * for that operation. This file is the only place LLM prompts get assembled.
 *
 * Key rules:
 *
 *  1. **Stable system prompt.** Defined here, identical for every request of a
 *     given operation. With Anthropic's prompt cache (cache_control), a stable
 *     system prompt costs ~10% on a cache hit. We never inject volatile data
 *     (timestamps, user names, streak counts) into it.
 *
 *  2. **Delta-only user payload.** Each operation declares the *minimal*
 *     fields it needs. The `pruneContext` step strips everything else, so
 *     even if the caller hands us a fat profile object, we never emit it.
 *
 *  3. **Session memo cache.** Identical (operation, prunedInput) tuples are
 *     hashed and short-circuited from a Map. This avoids billing for
 *     deterministic re-asks during a single session (e.g. user re-opens the
 *     log screen with the same description).
 *
 *  4. **Pluggable transport.** The default `stubTransport` runs offline and
 *     returns plausible mock data — keeps the app fully functional without an
 *     API key, and keeps tests deterministic. Switching to a real Anthropic
 *     backend means swapping `setLlmTransport(anthropicTransport)` at app
 *     startup, no other code changes.
 */

import { HealthCondition } from '../logic/healthFilter';

// ─────────────────────────────────────────────────────────────────────
// Operation contracts
// ─────────────────────────────────────────────────────────────────────

/**
 * Currently the only LLM-backed operation: turn a free-text meal description
 * ("2 chapatis with daal masoor and a small bowl of yogurt") into structured
 * catalog matches that the nutrition store can log.
 */
export interface InterpretMealInput {
  description: string;
  /** Subset of user conditions — used to tone responses, never PII. */
  conditions: HealthCondition[];
}

export interface InterpretMealOutput {
  items: Array<{
    /** Free-form name as parsed from the description. */
    name: string;
    /** Best-guess portion in grams. */
    portionG: number;
    /** Confidence in [0, 1]; UI may dim low-confidence rows. */
    confidence: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// Stable system prompts (one per operation)
// ─────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  interpretMeal:
    `You are a Pakistani-cuisine nutrition assistant for PulseHealth.\n` +
    `Given a free-text meal description, return JSON of the form\n` +
    `{ "items": [ { "name": string, "portionG": number, "confidence": 0..1 } ] }.\n` +
    `Use canonical Pakistani names (Roti, Daal Masoor, Karahi, etc.). ` +
    `Never include explanations outside the JSON.`,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Pruning — the actual token-saver
// ─────────────────────────────────────────────────────────────────────

/**
 * Whitelist what each operation may ever see. Anything not whitelisted is
 * dropped before we hand the payload to the transport. This is the load-
 * bearing function for token efficiency — keep it lean.
 */
function pruneContext(input: InterpretMealInput): InterpretMealInput {
  const allowedConditions: HealthCondition[] = ['diabetes', 'hypertension', 'high_cholesterol', 'pcos'];
  return {
    description: input.description.trim().slice(0, 500), // cap input length
    conditions: input.conditions.filter(c => allowedConditions.includes(c)),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Transport contract
// ─────────────────────────────────────────────────────────────────────

export interface LlmRequest {
  operation: keyof typeof SYSTEM_PROMPTS;
  systemPrompt: string;
  userPayload: unknown;          // pruned, JSON-serializable
}

export interface LlmTransport {
  send: (req: LlmRequest) => Promise<unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// Stub transport — runs offline, deterministic, keeps the demo working
// ─────────────────────────────────────────────────────────────────────

/**
 * Tiny keyword-match heuristic. Good enough to demonstrate the flow without
 * hitting an API. Replace by setLlmTransport(realAnthropicTransport) in prod.
 */
/**
 * Patterns intentionally allow trailing 's' for English-style plurals
 * ("rotis", "eggs", "parathas") since users mix Urdu and English freely.
 * `(?:s|es)?` after the noun + word-boundary at the start covers it.
 */
const STUB_KEYWORD_MAP: Array<{ keyword: RegExp; name: string; portionG: number }> = [
  { keyword: /\b(?:roti|chapati|chapatti)s?\b/i, name: 'Whole Wheat Roti',           portionG: 40 },
  { keyword: /\bnaans?\b/i,                       name: 'Naan',                       portionG: 90 },
  { keyword: /\bparathas?\b/i,                    name: 'Plain Paratha',              portionG: 80 },
  { keyword: /\b(?:rice|chawal|basmati)\b/i,      name: 'Basmati Rice (cooked)',      portionG: 150 },
  { keyword: /\bbiryani\b/i,                      name: 'Chicken Biryani',            portionG: 250 },
  { keyword: /\b(?:daal|dal|lentils?)\b/i,        name: 'Daal Masoor (red lentil)',   portionG: 200 },
  { keyword: /\b(?:karahi|handi)\b/i,             name: 'Chicken Karahi',             portionG: 250 },
  { keyword: /\bnihari\b/i,                       name: 'Beef Nihari',                portionG: 250 },
  { keyword: /\bhaleem\b/i,                       name: 'Haleem',                     portionG: 250 },
  { keyword: /\b(?:yogurt|dahi)\b/i,              name: 'Plain Yogurt (Dahi)',        portionG: 150 },
  { keyword: /\beggs?\b/i,                        name: 'Egg (boiled)',               portionG: 50 },
  { keyword: /\b(?:chana|chickpeas?)\b/i,         name: 'Chana Masala',               portionG: 200 },
];

export const stubTransport: LlmTransport = {
  async send(req): Promise<InterpretMealOutput> {
    if (req.operation === 'interpretMeal') {
      const input = req.userPayload as InterpretMealInput;
      const items: InterpretMealOutput['items'] = [];
      for (const entry of STUB_KEYWORD_MAP) {
        if (entry.keyword.test(input.description)) {
          // Naive multiplier: "2 rotis" → portion × 2
          const numMatch = input.description.match(/(\d+)\s*(?=\w*(roti|chapati|naan|paratha|egg|piece))/i);
          const mult = numMatch ? Math.min(10, Math.max(1, Number(numMatch[1]))) : 1;
          items.push({
            name: entry.name,
            portionG: entry.portionG * mult,
            confidence: 0.6,
          });
        }
      }
      return { items };
    }
    throw new Error(`stubTransport: unknown operation ${req.operation}`);
  },
};

// ─────────────────────────────────────────────────────────────────────
// Session memo cache
// ─────────────────────────────────────────────────────────────────────

function stableHash(payload: unknown): string {
  // Cheap deterministic hash. Stringify with sorted keys so equivalent
  // objects collide. djb2 keeps it allocation-light without crypto deps.
  const json = stableStringify(payload);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const obj = v as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

const memo = new Map<string, unknown>();
export function clearLlmMemo(): void { memo.clear(); }

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

let _transport: LlmTransport = stubTransport;
export function setLlmTransport(t: LlmTransport): void { _transport = t; }
export function getLlmTransport(): LlmTransport { return _transport; }

export interface LlmCallStats {
  cached: boolean;
  promptBytes: number;     // size of pruned payload + system prompt
}

export interface InterpretMealResult {
  output: InterpretMealOutput;
  stats: LlmCallStats;
}

export async function interpretMeal(
  input: InterpretMealInput
): Promise<InterpretMealResult> {
  const pruned = pruneContext(input);
  const cacheKey = `interpretMeal:${stableHash(pruned)}`;

  if (memo.has(cacheKey)) {
    return {
      output: memo.get(cacheKey) as InterpretMealOutput,
      stats: {
        cached: true,
        promptBytes: 0,    // nothing sent
      },
    };
  }

  const req: LlmRequest = {
    operation: 'interpretMeal',
    systemPrompt: SYSTEM_PROMPTS.interpretMeal,
    userPayload: pruned,
  };
  const promptBytes =
    req.systemPrompt.length + JSON.stringify(req.userPayload).length;

  const raw = await _transport.send(req);
  const output = raw as InterpretMealOutput;
  memo.set(cacheKey, output);

  return { output, stats: { cached: false, promptBytes } };
}

// ─────────────────────────────────────────────────────────────────────
// Test hooks
// ─────────────────────────────────────────────────────────────────────

/** Exposed for unit tests — DO NOT use in app code. */
export const __test = {
  pruneContext,
  stableHash,
  stableStringify,
  SYSTEM_PROMPTS,
};
