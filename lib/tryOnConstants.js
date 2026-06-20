/** Shared constants for AI virtual try-on generation. */

export const GEMINI_MODEL = 'gemini-3.1-flash-image';
export const PROMPT_VERSION = '2026-06-20-v1';
export const IMAGE_ASPECT_RATIO = '2:3';
export const IMAGE_RESOLUTION = '2K';
export const MODEL_IMAGE_VERSION = 'preview-model-v1';
export const FETCH_TIMEOUT_MS = 55000;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 4096;
export const MAX_GARMENT_REFERENCES = 8;
export const DEMO_YACHT_ID = '__demo__';

export function hasAITryOn() {
  return Boolean(process.env.GEMINI_API_KEY);
}
