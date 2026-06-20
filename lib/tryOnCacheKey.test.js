import { describe, it, expect } from 'vitest';
import { computeTryOnCacheKey } from './tryOnCacheKey.js';

describe('computeTryOnCacheKey', () => {
  const base = {
    modelId: 'woman',
    bodyType: 'woman',
    view: 'front',
    productIds: ['a', 'b'],
    colours: { a: 'White', b: 'Navy' },
    garments: [
      { productId: 'a', imageSourceHash: 'img-a' },
      { productId: 'b', imageSourceHash: 'img-b' },
    ],
    rerollSeed: 0,
  };

  it('is stable for identical inputs', () => {
    const one = computeTryOnCacheKey(base);
    const two = computeTryOnCacheKey(base);
    expect(one).toBe(two);
    expect(one).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when garments, colours, view, body type, or reroll change', () => {
    const original = computeTryOnCacheKey(base);
    expect(computeTryOnCacheKey({ ...base, view: 'back' })).not.toBe(original);
    expect(computeTryOnCacheKey({ ...base, bodyType: 'man', modelId: 'man' })).not.toBe(original);
    expect(computeTryOnCacheKey({ ...base, colours: { a: 'Navy', b: 'White' } })).not.toBe(original);
    expect(computeTryOnCacheKey({ ...base, productIds: ['a', 'c'] })).not.toBe(original);
    expect(computeTryOnCacheKey({ ...base, rerollSeed: 42 })).not.toBe(original);
    expect(computeTryOnCacheKey({
      ...base,
      garments: [{ productId: 'a', imageSourceHash: 'img-a-changed' }],
    })).not.toBe(original);
  });
});
