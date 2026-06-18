import { describe, it, expect } from 'vitest';
import { adjustmentKey, applyPreviewAdjustment } from './previewAdjustments';

describe('previewAdjustments', () => {
  it('builds stable storage keys', () => {
    expect(adjustmentKey('abc', 'woman', 'front')).toBe('abc:woman:front');
    expect(adjustmentKey('abc', 'man', 'back')).toBe('abc:man:back');
  });

  it('merges slot deltas onto base placement', () => {
    const base = { top: 20, left: 10, width: 80, height: 30, z: 25, scale: 1.1 };
    const next = applyPreviewAdjustment(base, {
      topDelta: 1.5,
      leftDelta: -2,
      widthDelta: 4,
      heightDelta: -3,
      scaleDelta: 0.1,
    });
    expect(next.top).toBe(21.5);
    expect(next.left).toBe(8);
    expect(next.width).toBe(84);
    expect(next.height).toBe(27);
    expect(next.scale).toBeCloseTo(1.2);
    expect(next.z).toBe(25);
  });

  it('returns the base slot when no adjustment is stored', () => {
    const base = { top: 18, left: 4, width: 92, height: 34, z: 30 };
    expect(applyPreviewAdjustment(base, {})).toEqual(base);
  });
});
