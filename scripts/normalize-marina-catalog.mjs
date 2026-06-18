#!/usr/bin/env node
/** Re-apply uniform taxonomy (category, imageHint, roleTags) to marinaCatalog.js + CSV. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marinaProducts } from '../lib/marinaCatalog.js';
import { normalizeUniformProduct, validateUniformCatalog } from '../lib/uniformTaxonomy.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_URL = 'https://www.marinayachtwear.com/';

const CATALOG_COLUMNS = [
  'category', 'name', 'brand', 'price', 'currency', 'vatRate', 'colours',
  'swatch', 'accent', 'fabric', 'details', 'fit', 'roleTags', 'leadTime', 'minOrder',
  'sizeRange', 'imageHint', 'imageUrl', 'colourImages', 'supplierName', 'productUrl', 'active',
];

function escapeCell(cell) {
  return `"${String(cell ?? '').replaceAll('"', '""')}"`;
}

const normalized = marinaProducts.map((p) => normalizeUniformProduct(p));
const issues = validateUniformCatalog(normalized);

if (issues.length) {
  console.error('Taxonomy validation failed:');
  issues.forEach((i) => console.error(' -', i));
  process.exit(1);
}

const js = `// Auto-generated from ${SOURCE_URL} — run: node scripts/fetch-marina-catalog.mjs
// Normalized: node scripts/normalize-marina-catalog.mjs
// ${normalized.length} products via shopify-json (Marina Yacht Wear)

export const marinaProducts = ${JSON.stringify(normalized, null, 2)};
`;

writeFileSync(join(root, 'lib/marinaCatalog.js'), js);

const csvRows = [
  CATALOG_COLUMNS,
  ...normalized.map((p) => CATALOG_COLUMNS.map((col) => {
    if (col === 'colours') return (p.colours || []).join('|');
    if (col === 'fit') return (p.fit || []).join('|');
    if (col === 'roleTags') return (p.roleTags || []).join('|');
    if (col === 'colourImages') return JSON.stringify(p.colourImages || {});
    if (col === 'currency') return 'EUR';
    if (col === 'vatRate') return '0';
    if (col === 'active') return p.active === false ? 'false' : 'true';
    return String(p[col] ?? '');
  })),
];

writeFileSync(
  join(root, 'docs/marina-yacht-wear-catalog.csv'),
  csvRows.map((r) => r.map(escapeCell).join(',')).join('\n') + '\n',
);

const changed = normalized.filter((p, i) => {
  const prev = marinaProducts[i];
  return p.category !== prev.category
    || p.imageHint !== prev.imageHint
    || JSON.stringify(p.roleTags) !== JSON.stringify(prev.roleTags);
});

console.log(`Normalized ${normalized.length} products (${changed.length} updated)`);
changed.forEach((p) => {
  const prev = marinaProducts.find((x) => x.id === p.id);
  console.log(`  ${prev.category} → ${p.category} | tags: ${(p.roleTags || []).join(',')} | ${p.name}`);
});
