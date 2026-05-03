import {
  __test, clearLlmMemo, interpretMeal, setLlmTransport, stubTransport,
} from '../src/services/llmMiddleware';

const { pruneContext, stableHash, stableStringify } = __test;

beforeEach(() => {
  setLlmTransport(stubTransport);
  clearLlmMemo();
});

describe('pruneContext (token efficiency)', () => {
  test('caps description length at 500 chars', () => {
    const long = 'a'.repeat(2000);
    const out = pruneContext({ description: long, conditions: [] });
    expect(out.description.length).toBe(500);
  });

  test('strips unknown conditions', () => {
    const out = pruneContext({
      description: 'roti',
      conditions: ['diabetes', 'unsupported_thing' as any],
    });
    expect(out.conditions).toEqual(['diabetes']);
  });

  test('does not leak fields not on the contract', () => {
    const fat: any = { description: 'roti', conditions: [], name: 'Munawar', age: 30, weight: 70 };
    const pruned = pruneContext(fat);
    expect(Object.keys(pruned).sort()).toEqual(['conditions', 'description']);
  });

  test('trims whitespace', () => {
    expect(pruneContext({ description: '   roti   ', conditions: [] }).description).toBe('roti');
  });
});

describe('stableHash / stableStringify', () => {
  test('object key order does not affect hash', () => {
    const a = stableStringify({ a: 1, b: { x: 2, y: 3 } });
    const b = stableStringify({ b: { y: 3, x: 2 }, a: 1 });
    expect(a).toBe(b);
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }));
  });

  test('different content → different hash', () => {
    expect(stableHash({ a: 1 })).not.toBe(stableHash({ a: 2 }));
  });
});

describe('interpretMeal (stub backend)', () => {
  test('parses "2 rotis with daal" into roti + daal items', async () => {
    const r = await interpretMeal({
      description: '2 rotis with daal masoor',
      conditions: ['diabetes'],
    });
    const names = r.output.items.map(i => i.name);
    expect(names).toContain('Whole Wheat Roti');
    expect(names).toContain('Daal Masoor (red lentil)');
    // 2x roti → 80g
    const roti = r.output.items.find(i => i.name === 'Whole Wheat Roti')!;
    expect(roti.portionG).toBe(80);
  });

  test('reports cache miss on first call, hit on identical second call', async () => {
    const a = await interpretMeal({ description: 'naan and karahi', conditions: [] });
    expect(a.stats.cached).toBe(false);
    expect(a.stats.promptBytes).toBeGreaterThan(0);

    const b = await interpretMeal({ description: 'naan and karahi', conditions: [] });
    expect(b.stats.cached).toBe(true);
    expect(b.stats.promptBytes).toBe(0);
    expect(b.output).toEqual(a.output);
  });

  test('different conditions → cache miss', async () => {
    const a = await interpretMeal({ description: 'roti', conditions: [] });
    const b = await interpretMeal({ description: 'roti', conditions: ['diabetes'] });
    expect(a.stats.cached).toBe(false);
    expect(b.stats.cached).toBe(false);
  });

  test('payload bytes are bounded by description length', async () => {
    const small = await interpretMeal({ description: 'roti', conditions: [] });
    const longDesc = 'roti '.repeat(200);
    const big = await interpretMeal({ description: longDesc, conditions: [] });
    // Even with a "big" input, pruning caps at 500 chars, so the user payload
    // is bounded. System prompt is fixed so total bytes stay tight.
    expect(big.stats.promptBytes).toBeLessThan(2000);
    expect(small.stats.promptBytes).toBeLessThan(big.stats.promptBytes);
  });
});

describe('LLM transport injection', () => {
  test('custom transport replaces stub', async () => {
    setLlmTransport({
      async send() { return { items: [{ name: 'fake', portionG: 100, confidence: 1 }] }; },
    });
    clearLlmMemo();
    const r = await interpretMeal({ description: 'whatever', conditions: [] });
    expect(r.output.items[0].name).toBe('fake');
  });
});
