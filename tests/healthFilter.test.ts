import { preferredFlagsFor, rankByPreference, scoreFood } from '../src/logic/healthFilter';

describe('preferredFlagsFor', () => {
  test('empty conditions → empty preferences', () => {
    expect(preferredFlagsFor([])).toEqual([]);
  });

  test('hypertension → low_sodium', () => {
    expect(preferredFlagsFor(['hypertension'])).toEqual(['low_sodium']);
  });

  test('diabetes → low_gi + high_fiber', () => {
    const p = preferredFlagsFor(['diabetes']);
    expect(p).toContain('low_gi');
    expect(p).toContain('high_fiber');
  });

  test('multiple conditions dedupe overlapping flags', () => {
    const p = preferredFlagsFor(['diabetes', 'high_cholesterol']);
    // both share high_fiber → should appear once
    expect(p.filter(f => f === 'high_fiber')).toHaveLength(1);
  });

  test('unknown condition string is ignored', () => {
    expect(preferredFlagsFor(['unknown_disease'])).toEqual([]);
  });
});

describe('scoreFood', () => {
  test('zero preferences scores zero', () => {
    expect(scoreFood({ healthFlags: ['low_sodium', 'low_gi'] }, [])).toBe(0);
  });

  test('matches each preferred flag the food has', () => {
    expect(scoreFood({ healthFlags: ['low_gi', 'high_fiber'] }, ['low_gi', 'high_fiber'])).toBe(2);
    expect(scoreFood({ healthFlags: ['low_gi'] }, ['low_gi', 'high_fiber'])).toBe(1);
    expect(scoreFood({ healthFlags: [] }, ['low_gi'])).toBe(0);
  });
});

describe('rankByPreference', () => {
  const foods = [
    { id: 'sweet',   healthFlags: [] },
    { id: 'lowna',   healthFlags: ['low_sodium'] },
    { id: 'fiber',   healthFlags: ['high_fiber'] },
    { id: 'both',    healthFlags: ['low_sodium', 'high_fiber'] },
    { id: 'sweet2',  healthFlags: [] },
  ];

  test('no preferences → original order preserved', () => {
    const out = rankByPreference(foods, []);
    expect(out.map(f => f.id)).toEqual(['sweet', 'lowna', 'fiber', 'both', 'sweet2']);
  });

  test('hypertension prefers low_sodium', () => {
    const out = rankByPreference(foods, ['low_sodium']);
    expect(out[0].id).toBe('lowna');
    expect(out[1].id).toBe('both');
  });

  test('multi-flag preferences favor matching foods first, neutral foods stay visible', () => {
    const out = rankByPreference(foods, ['low_sodium', 'high_fiber']);
    // 'both' has 2 matches, 'lowna' and 'fiber' have 1 each, neutral foods last.
    expect(out[0].id).toBe('both');
    expect(out[out.length - 1].id).toBe('sweet2');
    // Stable: the two 1-match foods preserve their original relative order
    const oneMatchIdx = out.findIndex(f => f.id === 'lowna');
    expect(out[oneMatchIdx + 1].id).toBe('fiber');
  });

  test('never filters out — all inputs survive', () => {
    expect(rankByPreference(foods, ['low_sodium']).length).toBe(foods.length);
  });
});
