/** Server-side product resolution and validation for try-on requests. */

import { getDb } from './db.js';
import { backendEnabled } from './config.js';
import { defaultProducts } from './catalog.js';
import { defaultProductColour, productImageForColour } from './productColour.js';
import { isAllowedTryOnImageUrl } from './tryOnAssets.js';
import { DEMO_YACHT_ID } from './tryOnConstants.js';

const demoCatalogById = new Map(defaultProducts.map((p) => [p.id, p]));

function normalizeColours(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const next = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key === 'string' && typeof value === 'string') {
      next[key] = value.slice(0, 80);
    }
  }
  return next;
}

function serializeDbProduct(p) {
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    brand: p.brand || '',
    imageUrl: p.imageUrl || '',
    colourImages: p.colourImages && typeof p.colourImages === 'object' ? p.colourImages : {},
    colours: p.colours || [],
    yachtId: p.yachtId,
    active: p.active,
  };
}

async function loadYachtProducts(yachtId, productIds) {
  const db = getDb();
  if (!db) return [];
  const rows = await db.product.findMany({
    where: {
      yachtId,
      id: { in: productIds },
      active: true,
    },
  });
  return rows.map(serializeDbProduct);
}

function loadDemoProducts(productIds) {
  return productIds
    .map((id) => demoCatalogById.get(id))
    .filter(Boolean)
    .map((p) => ({ ...p, yachtId: DEMO_YACHT_ID }));
}

function resolveProductImage(product, colour, view) {
  const chosen = colour || defaultProductColour(product);
  let imageUrl = productImageForColour(product, chosen);

  if (view === 'back' && product.colourImages?.[`${chosen} (back)`]) {
    imageUrl = product.colourImages[`${chosen} (back)`];
  } else if (view === 'back' && product.backImageUrl) {
    imageUrl = product.backImageUrl;
  }

  return { colour: chosen, imageUrl };
}

export async function resolveTryOnProducts({
  productIds,
  colours,
  yachtId,
  view,
  origin,
}) {
  const ids = Array.isArray(productIds)
    ? [...new Set(productIds.filter((id) => typeof id === 'string' && id))]
    : [];

  if (!ids.length) {
    throw new Error('No products provided');
  }

  const colourMap = normalizeColours(colours);
  let products = [];

  if (backendEnabled && yachtId) {
    products = await loadYachtProducts(yachtId, ids);
    const found = new Set(products.map((p) => p.id));
    const unknown = ids.filter((id) => !found.has(id));
    if (unknown.length) {
      throw new Error(`Unknown product IDs: ${unknown.join(', ')}`);
    }
  } else {
    products = loadDemoProducts(ids);
    const found = new Set(products.map((p) => p.id));
    const unknown = ids.filter((id) => !found.has(id));
    if (unknown.length) {
      throw new Error(`Unknown product IDs: ${unknown.join(', ')}`);
    }
  }

  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return ordered.map((product) => {
    const { colour, imageUrl } = resolveProductImage(product, colourMap[product.id], view);
    if (!imageUrl) {
      throw new Error(`Product ${product.id} has no image for the selected colour`);
    }
    if (!isAllowedTryOnImageUrl(imageUrl, origin) && !imageUrl.startsWith('/')) {
      throw new Error(`Product ${product.id} image URL is not allowed`);
    }

    return {
      ...product,
      resolvedColour: colour,
      resolvedImageUrl: imageUrl,
      imageSourceHash: imageUrl,
    };
  });
}

export { normalizeColours };
