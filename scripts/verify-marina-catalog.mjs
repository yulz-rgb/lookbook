#!/usr/bin/env node
/** End-to-end checks for Marina catalog integration. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marinaProducts } from '../lib/marinaCatalog.js';
import { defaultProducts, defaultLooks } from '../lib/catalog.js';
import {
  extractShopifyCatalog,
  isSafeFetchUrl,
  isUniformCatalogRecord,
} from '../lib/catalogExtract.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function ok(label) {
  console.log(`✓ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`✗ ${label}${detail ? `: ${detail}` : ''}`);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'YachtUniformCatalogBot/1.0' },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// --- Static integration ---
if (defaultProducts === marinaProducts) ok('defaultProducts uses marinaCatalog');
else fail('defaultProducts uses marinaCatalog');

if (marinaProducts.length >= 170) ok(`${marinaProducts.length} uniform products loaded`);
else fail('product count', String(marinaProducts.length));

const nonUniform = marinaProducts.filter((p) => !isUniformCatalogRecord(p));
if (nonUniform.length === 0) ok('No non-uniform items in cached catalog');
else fail('non-uniform items remain', nonUniform.map((p) => p.name).join(', '));

const expectedCount = marinaProducts.length;

const withImages = marinaProducts.filter((p) => /^https:\/\//.test(p.imageUrl || '')).length;
if (withImages >= expectedCount - 5) ok(`${withImages} products have image URLs`);
else fail('image coverage', `${withImages}/${expectedCount}`);

const withPrice = marinaProducts.filter((p) => p.price > 0).length;
if (withPrice >= expectedCount - 5) ok(`${withPrice} products have prices`);
else fail('price coverage', `${withPrice}/${expectedCount}`);

const withColours = marinaProducts.filter((p) => p.colours?.length > 0).length;
ok(`${withColours} products have colour options`);

for (const look of defaultLooks) {
  for (const pid of look.productIds) {
    if (!marinaProducts.some((p) => p.id === pid)) {
      fail(`look "${look.name}" references missing product`, pid);
    }
  }
}
if (!failed) ok(`All ${defaultLooks.length} sample looks reference valid products`);

try {
  for (const look of defaultLooks) {
    const items = look.productIds.map((pid) => marinaProducts.find((p) => p.id === pid)).filter(Boolean);
    const subtotal = items.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    if (items.length !== look.productIds.length) throw new Error(`${look.id} missing products`);
    if (subtotal <= 0) throw new Error(`${look.id} zero subtotal`);
  }
  ok('Look totals compute without error');
} catch (err) {
  fail('Look totals', err.message);
}

const csv = readFileSync(join(root, 'docs/marina-yacht-wear-catalog.csv'), 'utf8');
const csvLines = csv.trim().split('\n').length - 1;
if (csvLines === expectedCount) ok(`CSV export has ${expectedCount} data rows`);
else fail('CSV row count', `${csvLines} (expected ${expectedCount})`);

// --- Live Shopify fetch ---
if (!isSafeFetchUrl('https://www.marinayachtwear.com/')) fail('isSafeFetchUrl blocks marina URL');
else ok('Marina URL passes safety check');

try {
  const { records, method } = await extractShopifyCatalog('https://www.marinayachtwear.com/', fetchJson);
  if (method !== 'shopify-json') fail('live extract method', method);
  else ok('Live extract uses shopify-json');
  if (records.length !== expectedCount) fail('live extract count', `${records.length} (expected ${expectedCount})`);
  else ok(`Live extract returns ${expectedCount} uniform products`);

  const liveNonUniform = records.filter((r) => !isUniformCatalogRecord(r));
  if (liveNonUniform.length) fail('live non-uniform items', liveNonUniform.map((r) => r.name).join(', '));
  else ok('Live extract excludes non-uniform items');

  const liveSample = records.find((r) => r.name === 'Apron with Pocket');
  if (!liveSample?.imageUrl?.includes('cdn.shopify.com')) {
    fail('live sample missing image');
  } else if (liveSample.price !== 19) {
    fail('live sample price', String(liveSample.price));
  } else if (!liveSample.colours.includes('Navy')) {
    fail('live sample colours');
  } else {
    ok('Live sample (Apron with Pocket) has price, colours, image');
  }

  const jsIds = new Set(marinaProducts.map((p) => p.sku));
  const liveSkus = new Set(records.map((r) => r.sku));
  const missing = [...jsIds].filter((s) => s && !liveSkus.has(s));
  if (missing.length) fail('SKU drift vs live store', `${missing.length} missing`);
  else ok('Cached catalog SKUs match live store');
} catch (err) {
  fail('live Shopify fetch', err.message);
}

// --- API route (optional if dev server running) ---
const base = process.env.BASE_URL || 'http://localhost:3000';
try {
  const res = await fetch(`${base}/api/import/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.marinayachtwear.com/' }),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (text.includes('sign-in')) {
    console.log('⚠ API extract skipped (auth redirect — use /demo or public route)');
  } else {
    const data = JSON.parse(text);
    if (!res.ok) fail('API extract', data.error || res.status);
    else if (data.records?.length !== expectedCount) fail('API extract count', String(data.records?.length));
    else if (data.method !== 'shopify-json') fail('API extract method', data.method);
    else ok(`API /import/extract returns ${expectedCount} products (${base})`);
  }
} catch (err) {
  if (err.name === 'TimeoutError' || err.cause?.code === 'ECONNREFUSED') {
    console.log(`⚠ API extract skipped (dev server not reachable at ${base})`);
  } else {
    fail('API extract', err.message);
  }
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
