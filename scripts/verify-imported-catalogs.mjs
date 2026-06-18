#!/usr/bin/env node
/** Verify all 13 imported supplier catalogs are present in defaultProducts. */
import { defaultProducts, importedSupplierCatalog } from '../lib/catalog.js';
import { supplierCatalogExports } from '../lib/supplierCatalogs/index.js';
import { IMPORTED_SUPPLIER_IDS } from '../lib/supplierSources.js';

let failed = false;

console.log('Imported supplier catalogs in defaultProducts:\n');
for (const entry of importedSupplierCatalog) {
  const raw = supplierCatalogExports.find((s) => s.id === entry.id)?.products?.length || 0;
  const ok = entry.count > 0 && entry.count <= raw;
  const mark = ok ? '✓' : '✗';
  if (!ok) failed = true;
  console.log(`${mark} ${entry.name.padEnd(28)} ${String(entry.count).padStart(5)} / ${raw} raw`);
}

console.log(`\nTotal defaultProducts: ${defaultProducts.length}`);
console.log(`Expected suppliers: ${IMPORTED_SUPPLIER_IDS.length}`);

if (failed) {
  console.error('\nSome imported catalogs are missing products. Run: npm run catalog:all');
  process.exit(1);
}

console.log('\nAll imported supplier catalogs present.');
