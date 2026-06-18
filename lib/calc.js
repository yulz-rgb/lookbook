// Pure, framework-free procurement calculations.
// Every function here is deterministic and unit-tested in calc.test.js.

const CURRENCY_SYMBOLS = { EUR: '\u20ac', USD: '$', GBP: '\u00a3' };

export function currencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || '\u20ac';
}

export function money(value, currency = 'EUR') {
  const n = Number(value || 0);
  return `${currencySymbol(currency)}${n.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function indexById(items = []) {
  const map = {};
  for (const item of items) map[item.id] = item;
  return map;
}

// Resolve the product ids attached to a look. Supports both the relational
// shape ({ items: [{ productId }] }) and the legacy shape ({ productIds: [] }).
export function lookProductIds(look) {
  if (!look) return [];
  if (Array.isArray(look.productIds)) return look.productIds;
  if (Array.isArray(look.items)) return look.items.map((i) => i.productId);
  return [];
}

export function lookProducts(look, productsById) {
  return lookProductIds(look)
    .map((id) => productsById[id])
    .filter(Boolean);
}

export function lookSubtotal(look, productsById) {
  return lookProducts(look, productsById).reduce((sum, p) => sum + num(p.price), 0);
}

export function buildLookTotals(looks = [], products = []) {
  const byId = indexById(products);
  return looks.map((look) => {
    const items = lookProducts(look, byId);
    return {
      ...look,
      products: items,
      itemCount: items.length,
      subtotal: items.reduce((sum, p) => sum + num(p.price), 0),
    };
  });
}

function normalizeSettings(settings = {}) {
  return {
    logoCost: num(settings.logoCost, 0),
    sparePercent: num(settings.sparePercent, 0),
    setsPerCrew: Math.max(1, num(settings.setsPerCrew, 1)),
    shippingFlat: num(settings.shippingFlat, 0),
    embroiderySetup: num(settings.embroiderySetup, 0),
    currency: settings.currency || 'EUR',
  };
}

// Per-crew-member order rows, including VAT derived from each product's rate.
export function computeCrewRows(crew = [], lookTotals = [], settings = {}) {
  const s = normalizeSettings(settings);
  const fallback = lookTotals[0];
  return crew.map((member) => {
    const look =
      lookTotals.find((l) => l.id === (member.assignedLookId ?? member.assignedLook)) || fallback;
    const products = look?.products || [];
    const itemCount = products.length;
    const garmentPerSet = look?.subtotal || 0;
    const logoPerSet = itemCount * s.logoCost;
    const vatPerSet = products.reduce(
      (sum, p) => sum + num(p.price) * (num(p.vatRate) / 100),
      0,
    );
    const perSet = garmentPerSet + logoPerSet;
    const total = perSet * s.setsPerCrew;
    return {
      ...member,
      lookId: look?.id,
      lookName: look?.name || 'Unassigned',
      itemCount,
      garmentPerSet,
      logoPerSet,
      vatPerSet,
      perSet,
      total,
      vatTotal: vatPerSet * s.setsPerCrew,
    };
  });
}

export function computeBudget(crew = [], lookTotals = [], settings = {}) {
  const s = normalizeSettings(settings);
  const rows = computeCrewRows(crew, lookTotals, settings);
  const itemsTotal = rows.reduce((sum, r) => sum + r.garmentPerSet * s.setsPerCrew, 0);
  const logoTotal = rows.reduce((sum, r) => sum + r.logoPerSet * s.setsPerCrew, 0);
  const baseTotal = itemsTotal + logoTotal;
  const spareTotal = baseTotal * (s.sparePercent / 100);
  const vatTotal = rows.reduce((sum, r) => sum + r.vatTotal, 0);
  const shippingTotal = s.shippingFlat;
  const setupTotal = s.embroiderySetup;
  const grandTotal = baseTotal + spareTotal + vatTotal + shippingTotal + setupTotal;
  return {
    crewCount: crew.length,
    itemsTotal,
    logoTotal,
    baseTotal,
    spareTotal,
    vatTotal,
    shippingTotal,
    setupTotal,
    grandTotal,
    currency: s.currency,
    rows,
  };
}

// Aggregate a supplier purchase order: one line per product, with the quantity
// needed across all crew and sets, plus spare allowance rounded up.
export function buildOrderSummary(crew = [], looks = [], products = [], settings = {}) {
  const s = normalizeSettings(settings);
  const productsById = indexById(products);
  const lookTotals = buildLookTotals(looks, products);
  const lookById = indexById(lookTotals);
  const counts = new Map();

  for (const member of crew) {
    const look = lookById[member.assignedLookId ?? member.assignedLook] || lookTotals[0];
    if (!look) continue;
    for (const product of look.products) {
      counts.set(product.id, (counts.get(product.id) || 0) + s.setsPerCrew);
    }
  }

  const lines = [];
  for (const [productId, baseQty] of counts.entries()) {
    const product = productsById[productId];
    if (!product) continue;
    const withSpare = Math.ceil(baseQty * (1 + s.sparePercent / 100));
    const meetsMoq = withSpare >= num(product.minOrder, 1);
    lines.push({
      productId,
      sku: product.sku || '',
      name: product.name,
      brand: product.brand || '',
      supplier: product.supplierName || product.brand || '',
      category: product.category,
      colours: product.colours || [],
      sizeRange: product.sizeRange || '',
      unitPrice: num(product.price),
      currency: product.currency || s.currency,
      baseQty,
      orderQty: withSpare,
      minOrder: num(product.minOrder, 1),
      meetsMoq,
      lineTotal: withSpare * num(product.price),
    });
  }
  lines.sort((a, b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name));
  return lines;
}

// Procurement validation: surfaces issues a buyer must resolve before ordering.
export function validateOrder(crew = [], looks = [], products = [], settings = {}) {
  const warnings = [];
  const productsById = indexById(products);
  const lookTotals = buildLookTotals(looks, products);
  const lookById = indexById(lookTotals);

  for (const member of crew) {
    if (!member.topSize || !member.bottomSize || !member.shoeSize) {
      warnings.push({
        level: 'warning',
        code: 'MISSING_SIZE',
        message: `${member.name || 'Crew member'} is missing one or more sizes.`,
      });
    }
    const look = lookById[member.assignedLookId ?? member.assignedLook];
    if (!look) {
      warnings.push({
        level: 'warning',
        code: 'NO_LOOK',
        message: `${member.name || 'Crew member'} has no assigned look.`,
      });
      continue;
    }
    for (const product of look.products) {
      const fit = product.fit || [];
      const body = member.bodyType;
      if (fit.length && body && !fit.includes(body)) {
        warnings.push({
          level: 'warning',
          code: 'FIT_MISMATCH',
          message: `${product.name} in "${look.name}" is not available for ${body}.`,
        });
      }
    }
  }

  for (const line of buildOrderSummary(crew, looks, products, settings)) {
    if (!line.meetsMoq) {
      warnings.push({
        level: 'error',
        code: 'BELOW_MOQ',
        message: `${line.name} order qty ${line.orderQty} is below supplier minimum ${line.minOrder}.`,
      });
    }
    if (!line.sku) {
      warnings.push({
        level: 'warning',
        code: 'MISSING_SKU',
        message: `${line.name} has no SKU and cannot be ordered reliably.`,
      });
    }
  }
  return warnings;
}
