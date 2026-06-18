/** Client-side product image fit — canvas keying without server routes or API keys. */

import { keyAndTrimProductImageData } from './productImageFit.js';

const KEYED_CACHE = new Map();

export { isVisibleProductPixel, findProductContentBounds, trimBounds } from './productImageFit.js';

function keyedDataUrlFromImage(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processed = keyAndTrimProductImageData(imageData.data, canvas.width, canvas.height);
  if (!processed) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = processed.width;
  canvas.height = processed.height;
  ctx.putImageData(new ImageData(processed.data, processed.width, processed.height), 0, 0);
  return canvas.toDataURL('image/png');
}

export function keyProductImage(src) {
  if (!src || typeof window === 'undefined') return Promise.resolve(src);
  if (KEYED_CACHE.has(src)) return KEYED_CACHE.get(src);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const keyed = keyedDataUrlFromImage(img);
        resolve(keyed || src);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

  KEYED_CACHE.set(src, promise);
  return promise;
}

export function fitProductImage(src) {
  if (!src || typeof window === 'undefined') return Promise.resolve(src);
  return keyProductImage(src);
}

export function clearKeyedImageCache() {
  KEYED_CACHE.clear();
}
