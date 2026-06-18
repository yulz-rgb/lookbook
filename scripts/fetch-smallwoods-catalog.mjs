#!/usr/bin/env node
/** Fetch Smallwood's Yachtwear catalog via Magento crawl. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractMagentoCatalog } from '../lib/catalogExtract.js';
import { normalizeUniformProduct, validateUniformCatalog } from '../lib/uniformTaxonomy.js';

const SOURCE_URL = 'https://www.smallwoods.com/';
const SUPPLIER_NAME = "Smallwood's Yachtwear";
const CATALOG_COLUMNS = [
  'category', 'name', 'brand', 'price', 'currency', 'vatRate', 'colours',
  'swatch', 'accent', 'fabric', 'details', 'fit', 'roleTags', 'leadTime', 'minOrder',
  'sizeRange', 'imageHint', 'imageUrl', 'colourImages', 'supplierName', 'productUrl', 'active',
];
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function escapeCell(cell) {
  return `"${String(cell ?? '').replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  return rows.map((r) => r.map(escapeCell).join(',')).join('\n');
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'YachtUniformCatalogBot/1.0',
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.text();
}

async function main() {
  const started = Date.now();
  const { records, method, categoriesScanned } = await extractMagentoCatalog(
    SOURCE_URL,
    fetchHtml,
    {
      onProgress: (p) => {
        if (p.phase === 'listing') {
          process.stdout.write(`\rCategories ${p.index}/${p.total} — ${p.category.slice(-48).padStart(48)}`);
        } else {
          process.stdout.write(`\rProduct details ${p.index}/${p.total}`.padEnd(72));
        }
      },
    },
  );

  const catalogProducts = records.map((p) => normalizeUniformProduct(p));
  const issues = validateUniformCatalog(catalogProducts);
  if (issues.length) {
    console.warn(`\nTaxonomy validation warnings (${issues.length}):`);
    issues.slice(0, 15).forEach((issue) => console.warn(' -', issue));
    if (issues.length > 15) console.warn(` ... and ${issues.length - 15} more`);
  }

  const jsPath = join(root, 'lib/smallwoodsCatalog.js');
  const js = `// Auto-generated from ${SOURCE_URL} — run: node scripts/fetch-smallwoods-catalog.mjs
// ${catalogProducts.length} products via ${method} (${SUPPLIER_NAME})

export const smallwoodsProducts = ${JSON.stringify(catalogProducts, null, 2)};
`;
  writeFileSync(jsPath, js);

  const csvRows = [
    CATALOG_COLUMNS,
    ...catalogProducts.map((p) => CATALOG_COLUMNS.map((col) => {
      if (col === 'colours') return (p.colours || []).join('|');
      if (col === 'fit') return (p.fit || []).join('|');
      if (col === 'roleTags') return (p.roleTags || []).join('|');
      if (col === 'colourImages') return JSON.stringify(p.colourImages || {});
      if (col === 'vatRate') return '0';
      if (col === 'active') return p.active === false ? 'false' : 'true';
      return String(p[col] ?? '');
    })),
  ];
  const csvPath = join(root, 'docs/smallwoods-yachtwear-catalog.csv');
  writeFileSync(csvPath, `${toCsv(csvRows)}\n`);

  const withImages = catalogProducts.filter((p) => p.imageUrl).length;
  const withPrices = catalogProducts.filter((p) => Number(p.price) > 0).length;
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nFetched ${catalogProducts.length} products from ${categoriesScanned} categories (${elapsed}s)`);
  console.log(`  ${withImages} with images, ${withPrices} with prices`);
  console.log(`Wrote ${jsPath}`);
  console.log(`Wrote ${csvPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
