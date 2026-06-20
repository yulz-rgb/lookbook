/** AI virtual try-on generation via Gemini — server-side only. */

import { uploadBlob } from './blob.js';
import { hasBlob } from './config.js';
import { buildTryOnPrompt } from './tryOnPrompt.js';
import { loadModelImage, loadValidatedImage } from './tryOnAssets.js';
import { computeTryOnCacheKey } from './tryOnCacheKey.js';
import { resolveVisualOutfit } from './tryOnOutfit.js';
import { resolveTryOnProducts } from './tryOnProducts.js';
import {
  createRenderRecord,
  findRenderByCacheKey,
  markRenderCompleted,
  markRenderFailed,
} from './tryOnRenderStore.js';
import {
  GEMINI_MODEL,
  PROMPT_VERSION,
  IMAGE_ASPECT_RATIO,
  IMAGE_RESOLUTION,
  FETCH_TIMEOUT_MS,
  hasAITryOn,
} from './tryOnConstants.js';

export { hasAITryOn };

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

async function callGemini({ modelImage, garmentImages, garments }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const parts = [
    { text: buildTryOnPrompt(garments) },
    { inlineData: modelImage },
    ...garmentImages.map((inlineData) => ({ inlineData })),
  ];

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        responseFormat: {
          image: { aspectRatio: IMAGE_ASPECT_RATIO, imageSize: IMAGE_RESOLUTION },
        },
      },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`AI try-on generation failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = await response.json();
  const resultParts = json?.candidates?.[0]?.content?.parts || [];
  const imagePart = resultParts.find((p) => p?.inlineData?.data);
  if (!imagePart) throw new Error('AI try-on returned no image');

  return {
    mimeType: imagePart.inlineData.mimeType || 'image/png',
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
  };
}

async function storeGeneratedImage(renderId, buffer, mimeType) {
  if (hasBlob) {
    return uploadBlob(`tryon/${renderId}.png`, buffer, { contentType: mimeType });
  }

  // Local demo fallback when Blob is not configured — still avoid base64 JSON payloads.
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const dir = join(process.cwd(), 'public', 'generated-tryon');
  await mkdir(dir, { recursive: true });
  const filename = `${renderId}.png`;
  await writeFile(join(dir, filename), buffer);
  return `/generated-tryon/${filename}`;
}

export async function requestTryOnRender({
  bodyType,
  view,
  productIds,
  colours,
  lookVersion = 0,
  reroll = false,
  origin,
  yachtId = null,
  userId = null,
}) {
  const modelId = bodyType === 'man' ? 'man' : 'woman';
  const normalizedView = view === 'back' ? 'back' : 'front';

  const products = await resolveTryOnProducts({
    productIds,
    colours,
    yachtId,
    view: normalizedView,
    origin,
  });

  const { garments, excludedNote } = resolveVisualOutfit(products, modelId);
  if (!garments.length) {
    throw new Error('No valid garment references for AI try-on');
  }

  let rerollSeed = 0;
  if (reroll) {
    rerollSeed = Math.floor(Date.now() / 1000);
  }

  const cacheKey = computeTryOnCacheKey({
    modelId,
    bodyType: modelId,
    view: normalizedView,
    productIds,
    colours,
    garments,
    rerollSeed,
  });

  if (!reroll) {
    const cached = await findRenderByCacheKey(cacheKey);
    if (cached?.status === 'completed' && cached.imageUrl) {
      return {
        renderId: cached.renderId,
        status: 'completed',
        imageUrl: cached.imageUrl,
        excludedNote: cached.excludedNote,
        lookVersion,
      };
    }
    if (cached?.status === 'generating') {
      return {
        renderId: cached.renderId,
        status: 'generating',
        lookVersion,
      };
    }
  }

  const render = await createRenderRecord({
    cacheKey,
    yachtId,
    userId,
    modelId,
    bodyType: modelId,
    view: normalizedView,
    productIds,
    colours,
    geminiModel: GEMINI_MODEL,
    promptVersion: PROMPT_VERSION,
    rerollSeed,
    lookVersion,
    excludedNote,
  });

  try {
    const [modelImage, ...garmentImages] = await Promise.all([
      loadModelImage(modelId, normalizedView, origin),
      ...garments.map((g) => loadValidatedImage(g.imageUrl, origin)),
    ]);

    const { mimeType, buffer } = await callGemini({
      modelImage,
      garmentImages,
      garments,
    });

    const blobUrl = await storeGeneratedImage(render.renderId, buffer, mimeType);
    const completed = await markRenderCompleted(render.renderId, { blobUrl, excludedNote });

    return {
      renderId: completed.renderId,
      status: 'completed',
      imageUrl: completed.imageUrl,
      excludedNote: completed.excludedNote,
      lookVersion,
    };
  } catch (err) {
    await markRenderFailed(render.renderId, err?.message || 'generation_failed');
    throw err;
  }
}
