import { describe, it, expect } from 'vitest';
import { isAllowedTryOnImageUrl, isAllowedTryOnImagePath } from './tryOnAssets.js';

describe('tryOnAssets URL policy', () => {
  it('allows local preview assets', () => {
    expect(isAllowedTryOnImagePath('/preview/model-woman-front.png')).toBe(true);
    expect(isAllowedTryOnImageUrl('/preview/cutout-woman-front.png', 'http://localhost:3000')).toBe(true);
  });

  it('blocks localhost and private hosts', () => {
    expect(isAllowedTryOnImageUrl('http://127.0.0.1/secret.jpg')).toBe(false);
    expect(isAllowedTryOnImageUrl('http://localhost/image.jpg')).toBe(false);
    expect(isAllowedTryOnImageUrl('http://192.168.1.10/image.jpg')).toBe(false);
  });

  it('blocks arbitrary external URLs', () => {
    expect(isAllowedTryOnImageUrl('https://evil.example.com/image.jpg')).toBe(false);
    expect(isAllowedTryOnImageUrl('https://metadata.google.internal/image.jpg')).toBe(false);
  });

  it('allows approved supplier CDNs', () => {
    expect(isAllowedTryOnImageUrl('https://cdn.shopify.com/s/files/1/example.jpg')).toBe(true);
    expect(isAllowedTryOnImageUrl('https://example.public.blob.vercel-storage.com/out.png')).toBe(true);
  });
});
