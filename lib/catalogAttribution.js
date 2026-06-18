/** Keep manufacturer brand + supplier source URLs in sync with bundled catalog defaults. */

import { normalizeUniformProduct } from './uniformTaxonomy.js';

function productNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

/** Stable merge key — id when present, otherwise supplier + name (avoids cross-supplier drops). */
export function catalogProductKey(product) {
  const id = String(product?.id || '').trim();
  if (id) return `id:${id}`;
  const supplier = String(product?.supplierName || product?.brand || '').trim().toLowerCase();
  return `name:${supplier}::${productNameKey(product?.name)}`;
}

export function productsMissingAttribution(products = []) {
  if (!products.length) return true;
  const marinaLike = products.filter((p) => p.id?.startsWith('marina-'));
  if (marinaLike.length < 10) return false;
  const withLinks = marinaLike.filter((p) => p.supplierName && p.productUrl).length;
  return withLinks < marinaLike.length * 0.5;
}

export function enrichProductsWithDefaults(stored = [], defaults = []) {
  const byId = new Map(defaults.filter((p) => p.id).map((p) => [p.id, p]));
  const byKey = new Map(defaults.map((p) => [catalogProductKey(p), p]));
  const byName = new Map(defaults.map((p) => [productNameKey(p.name), p]));

  return stored.map((p) => {
    const ref = (p.id && byId.get(p.id))
      || byKey.get(catalogProductKey(p))
      || ((!p.supplierName && byName.get(productNameKey(p.name))) || null);
    if (!ref) return normalizeUniformProduct(p);
    return normalizeUniformProduct({
      ...ref,
      ...p,
      id: p.id || ref.id,
      brand: p.brand || ref.brand || '',
      supplierName: p.supplierName || ref.supplierName || '',
      productUrl: p.productUrl || ref.productUrl || '',
      fit: ref.fit?.length ? ref.fit : p.fit,
      colourImages: { ...(ref.colourImages || {}), ...(p.colourImages || {}) },
      imageUrl: p.imageUrl || ref.imageUrl || '',
      swatch: p.swatch || ref.swatch,
      price: p.price ?? ref.price,
    });
  });
}

/** Enrich stored rows and append bundled catalog items missing from workspace state. */
export function mergeCatalogWithDefaults(stored = [], defaults = []) {
  if (!defaults.length) {
    return stored.map((p) => normalizeUniformProduct(p));
  }
  if (!stored.length) {
    return defaults.map((p) => ({ ...p }));
  }

  const enriched = enrichProductsWithDefaults(stored, defaults);
  const seenKeys = new Set(enriched.map(catalogProductKey));

  const added = defaults.filter((p) => {
    if (seenKeys.has(catalogProductKey(p))) return false;
    const name = productNameKey(p.name);
    const supplier = String(p.supplierName || '').toLowerCase();
    if (enriched.some((e) => productNameKey(e.name) === name
      && String(e.supplierName || '').toLowerCase() === supplier)) {
      return false;
    }
    return true;
  });

  return added.length ? [...enriched, ...added] : enriched;
}

export function resolveCatalogProducts(source, defaults = []) {
  return ensureFullBundledCatalog(source, defaults);
}

/** Always return the full bundled catalog — append stored custom rows without dropping suppliers. */
export function ensureFullBundledCatalog(stored = [], defaults = []) {
  if (!defaults.length) {
    return stored.length ? stored.map((p) => normalizeUniformProduct(p)) : [];
  }
  if (!stored.length) return defaults.map((p) => ({ ...p }));
  const merged = mergeCatalogWithDefaults(stored, defaults);
  if (merged.length >= defaults.length) return merged;
  return mergeCatalogWithDefaults([], defaults);
}

export function isSparseServerCatalog(stored = [], defaults = []) {
  if (!stored.length || !defaults.length) return false;
  return stored.length < defaults.length * 0.85;
}
