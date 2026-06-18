#!/usr/bin/env node
/** Re-fetch detail pages for broken images / missing prices without full re-crawl. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { superyachtProducts } from '../lib/superyachtCatalog.js';
import { extractEshopProductDetail } from '../lib/catalogExtract.js';
import { normalizeUniformProduct } from '../lib/uniformTaxonomy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { Accept: 'text/html', 'User-Agent': 'YachtUniformCatalogBot/1.0' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function imageOk(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'YachtUniformCatalogBot/1.0' }, redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

const targets = [];
for (const product of superyachtProducts) {
  const needsPrice = !Number(product.price);
  const needsImage = !(await imageOk(product.imageUrl));
  if ((needsPrice || needsImage) && product.productUrl) targets.push({ product, needsPrice, needsImage });
}

console.log(`Patching ${targets.length} products...`);
const patched = superyachtProducts.map((p) => ({ ...p }));
const byUrl = new Map(patched.map((p, i) => [p.productUrl, i]));

for (let i = 0; i < targets.length; i += 6) {
  const batch = targets.slice(i, i + 6);
  await Promise.all(batch.map(async ({ product, needsPrice, needsImage }) => {
    try {
      const html = await fetchHtml(product.productUrl);
      const detail = extractEshopProductDetail(html, product.productUrl);
      const idx = byUrl.get(product.productUrl);
      if (idx == null) return;
      const next = { ...patched[idx] };
      if (needsPrice && detail.price > 0) {
        next.price = detail.price;
        next.currency = detail.currency === 'GBP' ? '£' : detail.currency;
      }
      if (needsImage && detail.imageUrl) {
        next.imageUrl = detail.imageUrl;
        if (detail.colourImages && Object.keys(detail.colourImages).length) {
          next.colourImages = detail.colourImages;
        }
      }
      if (detail.fabric && !next.fabric) next.fabric = detail.fabric;
      if (detail.sizeRange && /Matching/i.test(next.sizeRange || '')) next.sizeRange = detail.sizeRange;
      patched[idx] = normalizeUniformProduct(next);
    } catch (err) {
      console.warn('skip', product.name, err.message);
    }
  }));
  process.stdout.write(`\r${Math.min(i + 6, targets.length)}/${targets.length}`);
}

const normalized = patched.map((p) => normalizeUniformProduct(p));
const js = `// Auto-generated from https://www.thesuperyachtshop.com/clothing — run: node scripts/fetch-superyacht-catalog.mjs
// Patched: node scripts/patch-superyacht-catalog.mjs
// ${normalized.length} products via eshop-crawl (The Superyacht Shop)

export const superyachtProducts = ${JSON.stringify(normalized, null, 2)};
`;
writeFileSync(join(root, 'lib/superyachtCatalog.js'), js);

let ok = 0;
let fail = 0;
for (const p of normalized) {
  if (await imageOk(p.imageUrl)) ok++;
  else fail++;
}
const noPrice = normalized.filter((p) => !Number(p.price)).length;
console.log(`\nImages ok: ${ok}/${normalized.length}, still missing price: ${noPrice}`);
