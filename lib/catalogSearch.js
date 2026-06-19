// Client-side search helpers for products and platform-wide lookup.

const DEFAULT_LIMITS = {
  products: 8,
  looks: 5,
  crew: 5,
  orders: 5,
};

function normalizeSearchQuery(query = '') {
  return String(query).trim().toLowerCase();
}

function joinParts(parts = []) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/** Build a searchable haystack from product fields. */
export function productSearchText(product = {}) {
  const colours = Array.isArray(product.colours) ? product.colours.join(' ') : '';
  const roleTags = Array.isArray(product.roleTags) ? product.roleTags.join(' ') : '';
  return joinParts([
    product.name,
    product.brand,
    product.supplierName,
    product.category,
    product.fabric,
    product.details,
    product.sizeRange,
    product.sku,
    product.externalId,
    product.id,
    colours,
    roleTags,
  ]);
}

export function productMatchesSearch(product, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return productSearchText(product).includes(q);
}

function matchesQuery(haystack, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return false;
  return String(haystack || '').toLowerCase().includes(q);
}

export function searchLooks(looks = [], query, limit = DEFAULT_LIMITS.looks) {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return looks
    .filter((look) => matchesQuery(`${look.name} ${look.description || ''}`, q))
    .slice(0, limit)
    .map((look) => ({ type: 'look', id: look.id, label: look.name, meta: look.description || '' }));
}

export function searchCrew(crew = [], query, limit = DEFAULT_LIMITS.crew) {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return crew
    .filter((member) => matchesQuery(
      [
        member.name,
        member.role,
        member.topSize && `top ${member.topSize}`,
        member.bottomSize && `bottom ${member.bottomSize}`,
        member.shoeSize && `shoe ${member.shoeSize}`,
        member.fitNotes,
      ].filter(Boolean).join(' '),
      q,
    ))
    .slice(0, limit)
    .map((member) => ({
      type: 'crew',
      id: member.id,
      label: member.name,
      meta: [member.role, member.topSize && `Top ${member.topSize}`].filter(Boolean).join(' · '),
    }));
}

export function searchOrders(orderHistory = [], query, limit = DEFAULT_LIMITS.orders) {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return orderHistory
    .filter((order) => matchesQuery(`${order.name || ''} ${order.status || ''}`, q))
    .slice(0, limit)
    .map((order) => ({
      type: 'order',
      id: order.id,
      label: order.name || 'Order snapshot',
      meta: (order.status || '').replace(/_/g, ' '),
    }));
}

export function searchProducts(products = [], query, limit = DEFAULT_LIMITS.products) {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  return products
    .filter((p) => p.active !== false && productMatchesSearch(p, q))
    .slice(0, limit)
    .map((p) => ({
      type: 'product',
      id: p.id,
      label: p.name,
      meta: [p.brand, p.supplierName].filter(Boolean).join(' · '),
    }));
}

/** Unified platform search across products, looks, crew, and orders. */
export function searchPlatform({
  products = [],
  looks = [],
  crew = [],
  orderHistory = [],
  query = '',
  limits = {},
} = {}) {
  const q = normalizeSearchQuery(query);
  if (!q) {
    return { query: '', products: [], looks: [], crew: [], orders: [], total: 0 };
  }

  const mergedLimits = { ...DEFAULT_LIMITS, ...limits };
  const productResults = searchProducts(products, q, mergedLimits.products);
  const lookResults = searchLooks(looks, q, mergedLimits.looks);
  const crewResults = searchCrew(crew, q, mergedLimits.crew);
  const orderResults = searchOrders(orderHistory, q, mergedLimits.orders);

  return {
    query: q,
    products: productResults,
    looks: lookResults,
    crew: crewResults,
    orders: orderResults,
    total: productResults.length + lookResults.length + crewResults.length + orderResults.length,
  };
}
