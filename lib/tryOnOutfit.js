/** Server-side outfit resolution for AI try-on — no conflicting garment layers. */

import { garmentAiLabel } from './previewAssets.js';

const FULL_BODY_CATEGORIES = new Set(['dresses', 'engineering']);
const TOP_CATEGORIES = new Set(['tops', 'shirts', 'chef-wear', 'spa-wear']);
const OUTERWEAR_CATEGORY = 'outerwear';
const BOTTOM_CATEGORY = 'bottoms';

const VISUAL_ORDER = [
  'fullBody',
  'outerwear',
  'top',
  'bottom',
  'footwear',
  'belt',
  'hat',
  'accessories',
];

function isJumpsuit(product) {
  return product?.category === 'engineering'
    || /\b(jumpsuit|coverall|overall)\b/i.test(product?.name || '');
}

function isDress(product) {
  return product?.category === 'dresses';
}

function isBelt(product) {
  return product?.category === 'accessories' && /\bbelt\b/i.test(product?.name || '');
}

function isHat(product) {
  return product?.category === 'accessories'
    && /\b(cap|beanie|hat)\b/i.test(product?.name || '');
}

function isFootwear(product) {
  return product?.category === 'shoes';
}

function classifyVisualRole(product) {
  if (isDress(product) || isJumpsuit(product)) return 'fullBody';
  if (product?.category === OUTERWEAR_CATEGORY) return 'outerwear';
  if (TOP_CATEGORIES.has(product?.category)) return 'top';
  if (product?.category === BOTTOM_CATEGORY) return 'bottom';
  if (isFootwear(product)) return 'footwear';
  if (isBelt(product)) return 'belt';
  if (isHat(product)) return 'hat';
  if (product?.category === 'accessories' || product?.category === 'epaulettes') return 'accessories';
  return 'accessories';
}

function pickOne(products, role) {
  return products.find((p) => classifyVisualRole(p) === role) || null;
}

/**
 * Resolve which selected products appear in the Gemini render.
 * Selected products remain in the look for pricing even when excluded visually.
 */
export function resolveVisualOutfit(products = [], bodyType = 'woman') {
  const active = products.filter(Boolean);
  const excluded = [];
  const notes = [];

  const byRole = {};
  for (const product of active) {
    const role = classifyVisualRole(product);
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(product);
  }

  const chosen = {};

  const fullBodyCandidates = [
    ...(byRole.fullBody || []),
  ].filter((p) => isDress(p) || isJumpsuit(p));

  if (fullBodyCandidates.length > 1) {
    notes.push('Multiple full-body garments selected; only one is shown in the AI visual.');
    fullBodyCandidates.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate full-body garment' }));
  }

  const fullBody = fullBodyCandidates[0] || null;
  if (fullBody) {
    chosen.fullBody = fullBody;
    for (const p of active) {
      if (p.id === fullBody.id) continue;
      if (TOP_CATEGORIES.has(p.category) || p.category === BOTTOM_CATEGORY) {
        excluded.push({ product: p, reason: 'replaced by full-body garment' });
      }
    }
  } else {
    const tops = (byRole.top || []);
    if (tops.length > 1) {
      notes.push('Multiple tops selected; only one top is shown in the AI visual.');
      tops.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate top' }));
    }
    chosen.top = tops[0] || null;

    const bottoms = byRole.bottom || [];
    if (bottoms.length > 1) {
      notes.push('Multiple bottoms selected; only one bottom is shown in the AI visual.');
      bottoms.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate bottom' }));
    }
    chosen.bottom = bottoms[0] || null;
  }

  const outerwearList = byRole.outerwear || [];
  if (outerwearList.length > 1) {
    notes.push('Multiple outerwear pieces selected; only one is shown in the AI visual.');
    outerwearList.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate outerwear' }));
  }
  chosen.outerwear = outerwearList[0] || null;

  if (chosen.outerwear && !chosen.top && !chosen.fullBody) {
    notes.push('Outerwear is shown without a separate top reference.');
  }

  const footwearList = byRole.footwear || [];
  if (footwearList.length > 1) {
    footwearList.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate footwear' }));
  }
  chosen.footwear = footwearList[0] || null;

  const beltList = byRole.belt || [];
  if (beltList.length > 1) {
    beltList.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate belt' }));
  }
  chosen.belt = beltList[0] || null;

  const hatList = byRole.hat || [];
  if (hatList.length > 1) {
    hatList.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate hat' }));
  }
  chosen.hat = hatList[0] || null;

  const accessoryList = (byRole.accessories || []).filter(
    (p) => !isBelt(p) && !isHat(p) && p.category === 'accessories',
  );
  if (accessoryList.length > 1) {
    notes.push('Multiple accessories selected; only the first accessory reference is included.');
    accessoryList.slice(1).forEach((p) => excluded.push({ product: p, reason: 'accessory limit' }));
  }
  chosen.accessories = accessoryList[0] || null;

  const epaulettes = active.filter((p) => p.category === 'epaulettes');
  if (epaulettes.length > 1) {
    epaulettes.slice(1).forEach((p) => excluded.push({ product: p, reason: 'duplicate epaulettes' }));
  }
  if (epaulettes[0]) {
    chosen.accessories = epaulettes[0];
    if (accessoryList[0] && accessoryList[0].id !== epaulettes[0].id) {
      excluded.push({ product: accessoryList[0], reason: 'replaced by epaulettes' });
    }
  }

  if (bodyType === 'man' && active.some(isDress)) {
    const dress = active.find(isDress);
    if (dress) excluded.push({ product: dress, reason: 'dress not used for male model' });
    delete chosen.fullBody;
  }

  const garments = [];
  for (const role of VISUAL_ORDER) {
    const product = chosen[role];
    if (!product?.resolvedImageUrl) continue;
    garments.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      colour: product.resolvedColour,
      label: garmentAiLabel(product),
      imageUrl: product.resolvedImageUrl,
      role,
    });
  }

  const excludedProducts = excluded.map(({ product, reason }) => ({
    id: product.id,
    name: product.name,
    reason,
  }));

  if (excludedProducts.length) {
    const names = excludedProducts.map((p) => p.name).join(', ');
    notes.push(`Not included in AI visual: ${names}.`);
  }

  return {
    garments,
    excludedProducts,
    excludedNote: notes.join(' '),
  };
}
