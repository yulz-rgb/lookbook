import { createHash } from 'crypto';
import {
  GEMINI_MODEL,
  PROMPT_VERSION,
  IMAGE_ASPECT_RATIO,
  IMAGE_RESOLUTION,
  MODEL_IMAGE_VERSION,
} from './tryOnConstants.js';

function stableColours(colours = {}) {
  return Object.keys(colours)
    .sort()
    .map((id) => `${id}:${colours[id]}`)
    .join('|');
}

function stableProductIds(productIds = []) {
  return [...productIds].sort().join('|');
}

function stableImageSources(garments = []) {
  return garments
    .map((g) => `${g.productId}:${g.imageSourceHash || g.imageUrl}`)
    .sort()
    .join('|');
}

/**
 * SHA-256 cache key for try-on renders.
 */
export function computeTryOnCacheKey({
  modelId,
  bodyType,
  view,
  productIds,
  colours,
  garments,
  rerollSeed = 0,
}) {
  const payload = [
    modelId,
    bodyType,
    view,
    stableProductIds(productIds),
    stableColours(colours),
    stableImageSources(garments),
    MODEL_IMAGE_VERSION,
    PROMPT_VERSION,
    GEMINI_MODEL,
    IMAGE_ASPECT_RATIO,
    IMAGE_RESOLUTION,
    String(rerollSeed),
  ].join('\n');

  return createHash('sha256').update(payload).digest('hex');
}
