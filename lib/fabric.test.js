import { describe, it, expect } from 'vitest';
import { cleanFabricComposition } from './fabric.js';

describe('cleanFabricComposition', () => {
  it('keeps percentage blends joined with &', () => {
    expect(cleanFabricComposition(
      '96% polyester and 4% elastane with a fabric weight of 160 g/m² , these pants offer excellent stretch',
    )).toBe('96% polyester & 4% elastane');
  });

  it('strips marketing copy without percentages', () => {
    expect(cleanFabricComposition(
      'High-quality fabric ensures exceptional colorfastness and long-lasting wear',
    )).toBe('');
  });

  it('handles slash-separated blends', () => {
    expect(cleanFabricComposition(
      'The 92% Polyester / 8% PU Spandex blend provides a 4-way stretch',
    )).toBe('92% polyester & 8% pu spandex');
  });

  it('drops weights sizes and care instructions', () => {
    expect(cleanFabricComposition(
      '95% polyester / 5% elastane Material weight: 300 g/m² Sizes: S – 3XL Care instructions: machine washable',
    )).toBe('95% polyester & 5% elastane');
  });

  it('keeps simple single-material lines', () => {
    expect(cleanFabricComposition('100% cotton jersey')).toBe('100% cotton jersey');
  });
});
