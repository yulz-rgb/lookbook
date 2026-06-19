#!/usr/bin/env node
/** Fetch one supplier catalog by id (see lib/supplierSources.js). */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SUPPLIER_SOURCES, supplierById } from '../lib/supplierSources.js';
import {
  extractShopifyCatalog,
  extractMagentoCatalog,
  extractEshopCatalog,
  extractWooCommerceStoreCatalog,
  extractWooCommerceSitemapCatalog,
  extractSeaDesignCatalog,
  extractWaypointCatalog,
} from '../lib/catalogExtract.js';
import { normalizeUniformProduct, validateUniformCatalog } from '../lib/uniformTaxonomy.js';
import { writeCatalogArtifacts } from './lib/catalogWriter.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const supplierId = process.argv[2];

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

async function fetchText(url) {
  return fetchHtml(url);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'YachtUniformCatalogBot/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json();
}

function onProgressFactory(label) {
  return (p) => {
    if (p.phase === 'listing') {
      process.stdout.write(`\r[${label}] categories ${p.index}/${p.total}`.padEnd(72));
    } else {
      process.stdout.write(`\r[${label}] details ${p.index}/${p.total}`.padEnd(72));
    }
  };
}

async function fetchSupplierCatalog(supplier) {
  if (supplier.skipFetch) {
    return { records: [], method: 'skipped', skipped: true };
  }
  if (supplier.platform === 'manual') {
    return { records: [], method: 'manual', notes: supplier.notes || '' };
  }

  const onProgress = onProgressFactory(supplier.id);
  let result;

  switch (supplier.platform) {
    case 'shopify':
      result = await extractShopifyCatalog(supplier.url, fetchJson, {
        maxProducts: supplier.maxProducts || 800,
      });
      break;
    case 'magento':
      result = await extractMagentoCatalog(supplier.url, fetchHtml, {
        categoryPaths: supplier.categoryPaths,
        onProgress,
      });
      break;
    case 'eshop':
      result = await extractEshopCatalog(supplier.url, fetchHtml, { onProgress });
      break;
    case 'woocommerce-store':
      result = await extractWooCommerceStoreCatalog(supplier.url, fetchJson, {
        supplierName: supplier.name,
        onProgress,
      });
      break;
    case 'woocommerce-sitemap':
      result = await extractWooCommerceSitemapCatalog(supplier.url, fetchHtml, fetchText, {
        supplierName: supplier.name,
        sitemapPaths: supplier.sitemapPaths,
        onProgress,
      });
      break;
    case 'sea-design':
      result = await extractSeaDesignCatalog(supplier.url, fetchHtml, {
        supplierName: supplier.name,
        onProgress,
      });
      break;
    case 'waypoint':
      result = await extractWaypointCatalog(supplier.url, fetchHtml, {
        supplierName: supplier.name,
        onProgress,
      });
      break;
    default:
      throw new Error(`Unknown platform: ${supplier.platform}`);
  }

  return result;
}

async function main() {
  if (!supplierId || supplierId === '--help') {
    console.log('Usage: node scripts/fetch-supplier-catalog.mjs <supplier-id>');
    console.log('Suppliers:', SUPPLIER_SOURCES.map((s) => s.id).join(', '));
    process.exit(supplierId ? 0 : 1);
  }

  const supplier = supplierById(supplierId);
  if (!supplier) {
    console.error(`Unknown supplier: ${supplierId}`);
    process.exit(1);
  }

  if (supplier.skipFetch) {
    console.log(`${supplier.name}: skipped (existing catalog at lib/${supplier.file})`);
    process.exit(0);
  }

  const started = Date.now();
  const { records, method, skipped, notes } = await fetchSupplierCatalog(supplier);
  const excludeUrls = new Set(supplier.excludeProductUrls || []);
  const catalogProducts = records
    .filter((p) => !excludeUrls.has(p.productUrl))
    .map((p) => normalizeUniformProduct({
      ...p,
      supplierName: p.supplierName || supplier.name,
    }));

  const issues = validateUniformCatalog(catalogProducts);
  if (issues.length) {
    console.warn(`\nTaxonomy validation warnings (${issues.length}):`);
    issues.slice(0, 10).forEach((issue) => console.warn(' -', issue));
  }

  const { jsPath, csvPath } = writeCatalogArtifacts({
    root,
    supplier,
    catalogProducts,
    method: skipped ? 'skipped' : method,
  });

  const withImages = catalogProducts.filter((p) => p.imageUrl).length;
  const withPrices = catalogProducts.filter((p) => Number(p.price) > 0).length;
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\n${supplier.name}: ${catalogProducts.length} products (${elapsed}s)`);
  if (notes) console.log(`  Note: ${notes}`);
  if (skipped) console.log('  Skipped (use existing catalog file)');
  console.log(`  ${withImages} with images, ${withPrices} with prices`);
  console.log(`Wrote ${jsPath}`);
  console.log(`Wrote ${csvPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
