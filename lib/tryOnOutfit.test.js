import { describe, it, expect } from 'vitest';
import { resolveVisualOutfit } from './tryOnOutfit.js';

describe('resolveVisualOutfit', () => {
  const base = (overrides) => ({
    id: 'x',
    name: 'Item',
    category: 'tops',
    resolvedImageUrl: 'https://cdn.shopify.com/s/files/example.jpg',
    resolvedColour: 'White',
    ...overrides,
  });

  it('prefers dress over separate top and bottom for women', () => {
    const products = [
      base({ id: 'd', category: 'dresses', name: 'Dress' }),
      base({ id: 't', category: 'tops', name: 'Polo' }),
      base({ id: 'b', category: 'bottoms', name: 'Shorts' }),
    ];
    const { garments, excludedProducts } = resolveVisualOutfit(products, 'woman');
    expect(garments.map((g) => g.productId)).toEqual(['d']);
    expect(excludedProducts.some((p) => p.id === 't')).toBe(true);
  });

  it('allows outerwear over top', () => {
    const products = [
      base({ id: 't', category: 'tops', name: 'Polo' }),
      base({ id: 'o', category: 'outerwear', name: 'Jacket' }),
    ];
    const { garments } = resolveVisualOutfit(products, 'woman');
    expect(garments.map((g) => g.productId)).toEqual(['o', 't']);
  });

  it('orders garments in stable visual order', () => {
    const products = [
      base({ id: 'h', category: 'accessories', name: 'Cap' }),
      base({ id: 's', category: 'shoes', name: 'Shoes' }),
      base({ id: 't', category: 'tops', name: 'Polo' }),
      base({ id: 'b', category: 'bottoms', name: 'Shorts' }),
    ];
    const { garments } = resolveVisualOutfit(products, 'woman');
    expect(garments.map((g) => g.role)).toEqual(['top', 'bottom', 'footwear', 'hat']);
  });
});
