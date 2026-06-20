// AI virtual try-on: composites the selected garments onto the model photo with
// Gemini 3.1 Flash Image ("nano banana 2") — the current-generation multi-image
// model with meaningfully better garment fidelity, fabric-drape understanding,
// and resolution than the 2.5 generation this previously ran on. Replaces naive
// CSS overlay compositing with a real photo edit so garments actually render on
// the model's body, pose, and lighting, the same approach commercial AI-fashion-
// model vendors (e.g. Botika) use: a foundation model trained on fashion-specific
// data (fabric flow/drape/fit), not a flat sticker overlay.
const GEMINI_MODEL = 'gemini-3.1-flash-image';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
// 2:3 matches the existing model photo framing (682x1024) so the sizing in
// lib/previewAssets.js (modelPhotoDimensions) stays correct without further
// layout changes. 2K nearly doubles linear resolution over the previous
// ~1024px default — sharper fabric texture, closer to studio product photography.
const IMAGE_ASPECT_RATIO = '2:3';
const IMAGE_RESOLUTION = '2K';
const FETCH_TIMEOUT_MS = 55000;
const MAX_CACHE_ENTRIES = 80;

// Evaluated per call (not a module-level constant) so the env var is read from
// the live serverless runtime — a build-time/cold-start snapshot could otherwise
// freeze this to false even after GEMINI_API_KEY is configured.
export function hasAITryOn() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Process-local cache so identical (bodyType, view, garment) combinations across
// requests/users don't re-spend API tokens — the single biggest lever on cost.
const cache = new Map();

function cacheKey(bodyType, view, garments) {
  const signature = garments.map((g) => g.imageUrl).sort().join('|');
  return `${bodyType}:${view}:${signature}`;
}

// The current model source photos live at public/preview/model-*.png, but their
// bytes are actually JPEG (mismatched extension from how they were authored) —
// sniff the real format from the file header rather than trusting the name.
function sniffImageMimeType(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  return 'image/jpeg';
}

// Fetched over HTTP from the app's own origin rather than read off disk: on
// Vercel's serverless runtime the dynamic public/ path can't be traced into the
// function bundle, so an fs read would throw. The real bytes are sniffed because
// these model-*.png files are actually JPEG (mismatched extension).
async function loadModelImage(bodyType, view, origin) {
  const url = `${origin}/preview/model-${bodyType}-${view}.png`;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Failed to fetch model image (${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType: sniffImageMimeType(buffer), data: buffer.toString('base64') };
}

async function loadGarmentImage(src, origin) {
  if (src.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(src);
    if (!match) throw new Error('Unsupported garment image data URL');
    return { mimeType: match[1], data: match[2] };
  }
  const url = src.startsWith('/') ? `${origin}${src}` : src;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Failed to fetch garment image (${response.status})`);
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType, data: buffer.toString('base64') };
}

function buildPrompt(garments) {
  const garmentLines = garments.map((g, i) => {
    const ordinal = i + 2; // image 1 is the person
    const named = g.name ? ` ("${g.name}")` : '';
    return `Image ${ordinal} shows the ${g.label}${named} — dress the person in exactly this item.`;
  });

  return [
    'You are a professional fashion photo editor producing studio e-commerce photography for a premium yacht-crew uniform catalog — the same caliber of output as commercial AI fashion-model platforms like Botika.',
    'Image 1 is a studio photo of a person wearing minimal base attire (swimwear) that exists only as a body and pose reference.',
    ...garmentLines,
    'Fully cover and replace the base attire wherever a selected garment covers that body region, and dress the person in the selected garment(s) instead.',
    'Match each garment\'s exact color, pattern, fabric texture, logo, hardware, and trim precisely as shown in its reference image — do not invent a different design or simplify details.',
    'Render real fabric physics: natural drape, weight, and stretch for the specific fabric type, with garment seams, collars, and cuffs sitting correctly on the body, soft creases at joints (elbows, waist, knees) consistent with the person\'s exact pose, and fine-grain texture (weave, knit, twill) visible up close.',
    'Fit every garment to the person\'s real body shape and proportions as a properly tailored, true-to-size garment would fit — never stretched flat, never floating off the body, never looking like a pasted sticker or flat overlay.',
    'Add subtle, physically accurate contact shadows and ambient occlusion where garments meet skin or other garments (under collars, sleeves, waistbands) and let the existing studio key light and soft fill light fall across the new garment exactly as it does on the rest of the scene, matching highlight direction and shadow softness.',
    'Keep the person\'s face, body shape, skin tone, hair, pose, camera framing, and the plain studio background completely unchanged. Do not alter anything except the clothing described above.',
    'Output a single sharp, photorealistic, high-resolution full-body image with the same framing and proportions as image 1, color-accurate and free of artifacts, indistinguishable from a real photograph taken on a professional product-photography set.',
  ].join(' ');
}

export async function generateTryOnImage({ bodyType, view, garments, origin }) {
  const key = cacheKey(bodyType, view, garments);
  const cached = cache.get(key);
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const [modelImage, ...garmentImages] = await Promise.all([
    loadModelImage(bodyType, view, origin),
    ...garments.map((g) => loadGarmentImage(g.imageUrl, origin)),
  ]);

  const parts = [
    { text: buildPrompt(garments) },
    { inlineData: modelImage },
    ...garmentImages.map((inlineData) => ({ inlineData })),
  ];

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
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

  const dataUrl = `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`;

  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, dataUrl);

  return dataUrl;
}
