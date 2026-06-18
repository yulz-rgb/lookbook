import { describe, it, expect } from 'vitest';
import { enrichProductsWithDefaults, productsMissingAttribution } from './catalogAttribution.js';

describe('catalogAttribution', () => {
  it('detects missing supplier links on marina products', () => {
    const stale = Array.from({ length: 10 }, (_, i) => ({ id: `marina-${i}`, sku: `sku-${i}` }));
    expect(productsMissingAttribution(stale)).toBe(true);
    expect(productsMissingAttribution([
      { id: 'marina-a', supplierName: 'Marina Yacht Wear', productUrl: 'https://example.com/a' },
      { id: 'marina-b', supplierName: 'Marina Yacht Wear', productUrl: 'https://example.com/b' },
    ])).toBe(false);
  });

  it('fills brand and supplier from bundled defaults', () => {
    const stored = [{ id: 'marina-polo', name: 'Polo', sku: 'polo' }];
    const defaults = [{
      id: 'marina-polo',
      sku: 'polo',
      brand: 'Kariban',
      supplierName: 'Marina Yacht Wear',
      productUrl: 'https://www.marinayachtwear.com/products/polo',
    }];
    const [enriched] = enrichProductsWithDefaults(stored, defaults);
    expect(enriched.brand).toBe('Kariban');
    expect(enriched.supplierName).toBe('Marina Yacht Wear');
    expect(enriched.productUrl).toContain('marinayachtwear.com');
  });
});
