import { describe, it, expect } from 'vitest';
import {
  findProductContentBounds,
  findTrimBounds,
  isContentAgainstBackground,
  isVisibleProductPixel,
  trimBounds,
} from './productImageFit.js';

describe('previewImage bounds', () => {
  it('treats near-white pixels as empty', () => {
    expect(isVisibleProductPixel(255, 255, 255, 255)).toBe(false);
    expect(isVisibleProductPixel(245, 245, 245, 255)).toBe(false);
    expect(isVisibleProductPixel(120, 80, 60, 255)).toBe(true);
  });

  it('finds the non-white content bounds', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    data[3] = 255;

    for (let y = 3; y <= 6; y += 1) {
      for (let x = 2; x <= 7; x += 1) {
        const i = (y * width + x) * 4;
        data[i] = 30;
        data[i + 1] = 40;
        data[i + 2] = 50;
        data[i + 3] = 255;
      }
    }

    expect(findProductContentBounds(data, width, height)).toEqual({
      minX: 2,
      minY: 3,
      maxX: 7,
      maxY: 6,
    });
  });

  it('adds padding without exceeding the canvas', () => {
    const bounds = { minX: 20, minY: 30, maxX: 79, maxY: 129 };
    expect(trimBounds(bounds, 100, 160, 0.02)).toEqual({
      minX: 19,
      minY: 28,
      maxX: 80,
      maxY: 131,
    });
  });

  it('finds trim bounds against a white catalog background', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 3).fill(255);

    for (let y = 3; y <= 6; y += 1) {
      for (let x = 2; x <= 7; x += 1) {
        const i = (y * width + x) * 3;
        data[i] = 241;
        data[i + 1] = 242;
        data[i + 2] = 247;
      }
    }

    expect(findTrimBounds(data, width, height, 3)).toEqual({
      minX: 2,
      minY: 3,
      maxX: 7,
      maxY: 6,
      background: { r: 255, g: 255, b: 255 },
    });
    expect(isContentAgainstBackground(241, 242, 247, 255, { r: 255, g: 255, b: 255 })).toBe(true);
  });
});
