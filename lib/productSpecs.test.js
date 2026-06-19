import { describe, it, expect } from 'vitest';
import {
  formatFabricDisplay,
  formatSizeDisplay,
  resolveProductFabric,
  resolveProductSizeRange,
} from './productSpecs.js';

describe('formatFabricDisplay', () => {
  it('joins blend parts with slashes', () => {
    expect(formatFabricDisplay('96% polyester & 4% elastane')).toBe('96% polyester / 4% elastane');
  });

  it('cleans and formats raw fabric text', () => {
    expect(formatFabricDisplay('95% cotton 5% elastane')).toBe('95% cotton / 5% elastane');
  });

  it('returns em dash when empty', () => {
    expect(formatFabricDisplay('')).toBe('—');
  });

  it('reads fabric from product details when the field is empty', () => {
    const product = {
      fabric: '',
      details: 'Fabric: 96% Bamboo 4% Elastane Medium weight jersey fabric 240g/m2',
    };
    expect(formatFabricDisplay(product)).toBe('96% bamboo / 4% elastane');
  });
});

describe('formatSizeDisplay', () => {
  it('returns the size range when present', () => {
    expect(formatSizeDisplay('XS–3XL')).toBe('XS–3XL');
  });

  it('normalizes one-size codes', () => {
    expect(formatSizeDisplay('1SIZE')).toBe('One size');
  });

  it('returns em dash when empty', () => {
    expect(formatSizeDisplay('')).toBe('—');
  });

  it('reads sizes from product details when sizeRange is empty', () => {
    const product = {
      sizeRange: '',
      details: 'Fabric: 100% cotton Sizes: XS - XL Care Instructions: Wash 30°',
    };
    expect(formatSizeDisplay(product)).toBe('XS–XL');
  });
});

describe('resolveProductFabric', () => {
  it('prefers the fabric field over details', () => {
    expect(resolveProductFabric({
      fabric: '100% cotton',
      details: 'Fabric: 95% polyester 5% elastane',
    })).toBe('100% cotton');
  });
});

describe('resolveProductSizeRange', () => {
  it('prefers sizeRange over details', () => {
    expect(resolveProductSizeRange({
      sizeRange: 'S–L',
      details: 'Sizes: XS - XL',
    })).toBe('S–L');
  });
});
