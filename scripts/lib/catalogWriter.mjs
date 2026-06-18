import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const CATALOG_COLUMNS = [
  'category', 'name', 'brand', 'price', 'currency', 'vatRate', 'colours',
  'swatch', 'accent', 'fabric', 'details', 'fit', 'roleTags', 'leadTime', 'minOrder',
  'sizeRange', 'imageHint', 'imageUrl', 'colourImages', 'supplierName', 'productUrl', 'active',
];

function escapeCell(cell) {
  return `"${String(cell ?? '').replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  return rows.map((r) => r.map(escapeCell).join(',')).join('\n');
}

export function writeCatalogArtifacts({
  root,
  supplier,
  catalogProducts,
  method,
}) {
  const dir = join(root, 'lib/supplierCatalogs');
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(root, 'docs/supplier-catalogs'), { recursive: true });

  const jsPath = join(dir, supplier.file);
  const js = `// Auto-generated from ${supplier.url} — run: node scripts/fetch-supplier-catalog.mjs ${supplier.id}
// ${catalogProducts.length} products via ${method} (${supplier.name})
${supplier.notes ? `// Note: ${supplier.notes}\n` : ''}
export const ${supplier.exportKey} = ${JSON.stringify(catalogProducts, null, 2)};
`;
  writeFileSync(jsPath, js);

  const csvRows = [
    CATALOG_COLUMNS,
    ...catalogProducts.map((p) => CATALOG_COLUMNS.map((col) => {
      if (col === 'colours') {
        return Array.isArray(p.colours) ? p.colours.join('|') : String(p.colours || '');
      }
      if (col === 'fit') {
        return Array.isArray(p.fit) ? p.fit.join('|') : String(p.fit || '');
      }
      if (col === 'roleTags') {
        return Array.isArray(p.roleTags) ? p.roleTags.join('|') : String(p.roleTags || '');
      }
      if (col === 'colourImages') return JSON.stringify(p.colourImages || {});
      if (col === 'vatRate') return '0';
      if (col === 'active') return p.active === false ? 'false' : 'true';
      return String(p[col] ?? '');
    })),
  ];
  const csvPath = join(root, 'docs/supplier-catalogs', `${supplier.id}.csv`);
  writeFileSync(csvPath, `${toCsv(csvRows)}\n`);

  return { jsPath, csvPath };
}
