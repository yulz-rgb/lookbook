import { describe, it, expect } from 'vitest';
import { resolveTryOnProducts } from './tryOnProducts.js';
import { assertRenderOwnership, clearMemoryRenderStore } from './tryOnRenderStore.js';
import { hasAITryOn } from './tryOnConstants.js';

describe('tryOnProducts', () => {
  it('validates demo catalog product IDs server-side', async () => {
    const products = await resolveTryOnProducts({
      productIds: ['marina-mens-combed-cotton-t-shirt'],
      colours: {},
      yachtId: null,
      view: 'front',
      origin: 'http://localhost:3000',
    });
    expect(products).toHaveLength(1);
    expect(products[0].resolvedImageUrl).toContain('cdn.shopify.com');
  });

  it('rejects unknown product IDs', async () => {
    await expect(resolveTryOnProducts({
      productIds: ['not-a-real-product-id'],
      colours: {},
      yachtId: null,
      view: 'front',
      origin: 'http://localhost:3000',
    })).rejects.toThrow(/Unknown product IDs/);
  });
});

describe('tryOnRender ownership', () => {
  it('denies cross-user access', () => {
    clearMemoryRenderStore();
    const render = {
      renderId: 'r1',
      userId: 'user-a',
      yachtId: 'yacht-a',
      status: 'completed',
    };
    expect(assertRenderOwnership(render, { userId: 'user-a', yachtId: 'yacht-a' })).toBe(true);
    expect(assertRenderOwnership(render, { userId: 'user-b', yachtId: 'yacht-a' })).toBe(false);
    expect(assertRenderOwnership(render, { userId: 'user-a', yachtId: 'yacht-b' })).toBe(false);
  });
});

describe('hasAITryOn', () => {
  it('reflects GEMINI_API_KEY presence', () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect(hasAITryOn()).toBe(false);
    process.env.GEMINI_API_KEY = original;
  });
});
