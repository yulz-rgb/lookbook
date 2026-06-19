import { describe, it, expect } from 'vitest';
import { formatFabricDisplay, formatSizeDisplay } from './productSpecs.js';

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
});
