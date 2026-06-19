'use client';

import { formatFabricDisplay, formatSizeDisplay } from '../lib/productSpecs.js';

/** Fabric composition and size range for catalog cards and list rows. */
export function ProductSpecs({ product }) {
  const fabric = formatFabricDisplay(product?.fabric);
  const sizes = formatSizeDisplay(product?.sizeRange);

  return (
    <div className="product-specs">
      <div className="product-spec">
        <strong>Fabric</strong>
        {fabric}
      </div>
      <div className="product-spec">
        <strong>Sizes</strong>
        {sizes}
      </div>
    </div>
  );
}
