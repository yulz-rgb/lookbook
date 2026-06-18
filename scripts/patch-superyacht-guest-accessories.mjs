#!/usr/bin/env node
/** Merge guest / amenities products from /accessories into superyachtCatalog.js */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  extractEshopCatalog,
  SUPERYACHT_GUEST_ACCESSORY_PATHS,
} from '../lib/catalogExtract.js';
import { superyachtProducts } from '../lib/superyachtCatalog.js';
import { normalizeUniformProduct } from '../lib/uniformTaxonomy.js';

const SOURCE_URL = 'https://www.thesuperyachtshop.com/';
const SUPPLIER_NAME = 'The Superyacht Shop';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': 'YachtUniformCatalogBot/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.text();
}

async function main() {
  const existing = new Map(superyachtProducts.map((p) => [p.productUrl.replace(/\/$/, ''), p]));
  const { records } = await extractEshopCatalog(SOURCE_URL, fetchHtml, {
    rootPath: '/accessories/bath-toiletries',
    extraCategoryPaths: SUPERYACHT_GUEST_ACCESSORY_PATHS.slice(1),
    listingDelayMs: 80,
    detailDelayMs: 60,
  });

  let added = 0;
  for (const record of records) {
    const url = record.productUrl.replace(/\/$/, '');
    if (existing.has(url)) continue;
    existing.set(url, normalizeUniformProduct(record));
    added += 1;
  }

  const merged = [...existing.values()].sort((a, b) => a.name.localeCompare(b.name));
  const jsPath = join(root, 'lib/superyachtCatalog.js');
  const js = `// Auto-generated from ${SOURCE_URL}clothing — run: node scripts/fetch-superyacht-catalog.mjs
// ${merged.length} products via eshop-crawl (${SUPPLIER_NAME})

export const superyachtProducts = ${JSON.stringify(merged, null, 2)};
`;
  writeFileSync(jsPath, js);
  console.log(`Added ${added} guest/amenity accessories (${merged.length} total)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
