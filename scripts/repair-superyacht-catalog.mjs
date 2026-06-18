#!/usr/bin/env node
/** Repair ids and re-normalize superyachtCatalog.js without re-crawling. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { superyachtProducts } from '../lib/superyachtCatalog.js';
import { normalizeUniformProduct } from '../lib/uniformTaxonomy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seen = new Map();

function slugFromUrl(productUrl = '') {
  try {
    const segments = new URL(productUrl).pathname.split('/').filter(Boolean);
    return segments.slice(1).join('-') || segments[segments.length - 1] || 'item';
  } catch {
    return 'item';
  }
}

const repaired = superyachtProducts.map((product) => {
  let slug = slugFromUrl(product.productUrl);
  let id = `sys-${slug}`;
  if (seen.has(id)) {
    const n = seen.get(id) + 1;
    seen.set(id, n);
    id = `${id}-${n}`;
  } else {
    seen.set(id, 1);
  }

  const sizeRange = String(product.sizeRange || '')
    .replace(/Matching.*/i, '')
    .replace(/([0-9]+)–([0-9]+)([A-Za-z])/g, '$1–$2');

  return normalizeUniformProduct({
    ...product,
    id,
    sizeRange,
  });
});

const js = `// Auto-generated from https://www.thesuperyachtshop.com/clothing — run: node scripts/fetch-superyacht-catalog.mjs
// Repaired: node scripts/repair-superyacht-catalog.mjs
// ${repaired.length} products via eshop-crawl (The Superyacht Shop)

export const superyachtProducts = ${JSON.stringify(repaired, null, 2)};
`;

writeFileSync(join(root, 'lib/superyachtCatalog.js'), js);

const ids = repaired.map((p) => p.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log(`Repaired ${repaired.length} products, ${dupes.length} duplicate ids remaining`);
