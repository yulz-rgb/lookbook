#!/usr/bin/env node
/** Fetch all supplier catalogs and regenerate lib/supplierCatalogs/index.js */
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SUPPLIER_SOURCES, IMPORTED_SUPPLIER_IDS } from '../lib/supplierSources.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const only = args.includes('--only')
  ? args[args.indexOf('--only') + 1]?.split(',').map((s) => s.trim()).filter(Boolean)
  : null;

const targets = (only || IMPORTED_SUPPLIER_IDS)
  .map((id) => SUPPLIER_SOURCES.find((s) => s.id === id))
  .filter(Boolean);
const results = [];

for (const supplier of targets) {
  console.log(`\n=== ${supplier.name} (${supplier.id}) ===`);
  const proc = spawnSync('node', ['scripts/fetch-supplier-catalog.mjs', supplier.id], {
    cwd: root,
    stdio: 'inherit',
  });
  results.push({ id: supplier.id, ok: proc.status === 0, status: proc.status });
}

const LEGACY_CATALOG_IMPORTS = {
  'marinaCatalog.js': '../marinaCatalog.js',
  'smallwoodsCatalog.js': '../smallwoodsCatalog.js',
  'superyachtCatalog.js': '../superyachtCatalog.js',
};

mkdirSync(join(root, 'lib/supplierCatalogs'), { recursive: true });

const indexLines = [
  '// Auto-generated — run: npm run catalog:all',
  ...SUPPLIER_SOURCES.flatMap((s) => {
    const importPath = LEGACY_CATALOG_IMPORTS[s.file]
      ? `${LEGACY_CATALOG_IMPORTS[s.file]}`
      : `./${s.file.replace(/\.js$/, '')}.js`;
    return [`import { ${s.exportKey} } from '${importPath}';`];
  }),
  '',
  'export const supplierCatalogExports = [',
  ...SUPPLIER_SOURCES.map((s) => `  { id: '${s.id}', name: ${JSON.stringify(s.name)}, products: ${s.exportKey} },`),
  '];',
  '',
  'export const allSupplierProducts = supplierCatalogExports.flatMap((s) => s.products);',
  '',
];

writeFileSync(join(root, 'lib/supplierCatalogs/index.js'), `${indexLines.join('\n')}\n`);

const failed = results.filter((r) => !r.ok);
console.log('\n=== Summary ===');
console.log(`Fetched ${results.length} suppliers, ${results.length - failed.length} succeeded`);
if (failed.length) {
  console.log('Failed:', failed.map((f) => f.id).join(', '));
  process.exit(1);
}
