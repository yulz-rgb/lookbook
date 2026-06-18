'use client';

/** Manufacturer brand + linked supplier for catalog cards and list rows. */
export function ProductAttribution({ product, compact = false }) {
  const brand = String(product.brand || '').trim();
  const supplier = String(product.supplierName || '').trim();
  const url = String(product.productUrl || '').trim();

  if (!brand && !supplier) return null;

  const sameSource = brand && supplier && brand.toLowerCase() === supplier.toLowerCase();

  return (
    <div className={`product-attribution ${compact ? 'compact' : ''}`}>
      {brand && !sameSource && (
        <span className="product-brand-line">
          <span className="product-meta-label">Brand</span>
          <span className="product-brand">{brand}</span>
        </span>
      )}
      {supplier && (
        <span className="product-supplier-line">
          <span className="product-meta-label">Supplier</span>
          {url ? (
            <a
              className="product-supplier-link"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${product.name} on ${supplier}`}
              onClick={(e) => e.stopPropagation()}
            >
              {supplier}
            </a>
          ) : (
            <span className="product-supplier">{supplier}</span>
          )}
        </span>
      )}
    </div>
  );
}
