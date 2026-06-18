/** Resolve a catalog image URL to a display-ready source. */

export function productImageDisplaySrc(src) {
  if (!src) return '';
  if (src.startsWith('/api/product-image')) return src;
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) return src;
  return `/api/product-image?url=${encodeURIComponent(src)}`;
}

export function isRemoteProductImage(src) {
  return Boolean(src && /^https?:\/\//i.test(src));
}
