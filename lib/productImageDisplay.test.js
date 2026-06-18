import { describe, it, expect } from 'vitest';
import { productImageDisplaySrc, isRemoteProductImage } from './productImageDisplay.js';

describe('productImageDisplaySrc', () => {
  it('proxies remote catalog images', () => {
    const remote = 'https://cdn.shopify.com/files/jacket.jpg';
    expect(productImageDisplaySrc(remote)).toBe('/api/product-image?url=' + encodeURIComponent(remote));
  });

  it('passes through local and data URLs', () => {
    expect(productImageDisplaySrc('/preview/shirt.png')).toBe('/preview/shirt.png');
    expect(productImageDisplaySrc('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('detects remote image URLs', () => {
    expect(isRemoteProductImage('https://example.com/a.jpg')).toBe(true);
    expect(isRemoteProductImage('/local/a.jpg')).toBe(false);
  });
});
