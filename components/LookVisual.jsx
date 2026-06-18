'use client';

import { productImageForColour, defaultProductColour } from '../lib/productColour';
import { cutoutSrc } from '../lib/previewAssets';
import { ProductPhoto } from './ProductPhoto';

export function ProductImageThumb({ product, size = 'md', selectedColour }) {
  const colour = selectedColour || defaultProductColour(product);
  const src = productImageForColour(product, colour);
  const label = product?.name || 'Product';

  return (
    <div className={`product-image-thumb product-image-thumb--${size}`} aria-hidden={!label}>
      {src ? (
        <ProductPhoto src={src} alt="" className="product-image-thumb-img" />
      ) : (
        <div
          className="product-image-thumb-fallback"
          style={{ background: product?.swatch || '#e2e8f0' }}
        />
      )}
    </div>
  );
}

export function LookVisual({ bodyType = 'woman', products = [], variant = 'thumb' }) {
  const cutout = cutoutSrc(bodyType, 'front');

  if (!products?.length) {
    return (
      <div className={`look-visual look-visual--${variant} look-visual--empty`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cutout} alt="" className="look-visual-cutout" />
      </div>
    );
  }

  if (products.length === 1) {
    return (
      <div className={`look-visual look-visual--${variant}`}>
        <ProductImageThumb product={products[0]} size={variant === 'item' ? 'lg' : 'md'} />
      </div>
    );
  }

  const shown = products.slice(0, 4);
  return (
    <div className={`look-visual look-visual--${variant} look-visual--grid`}>
      {shown.map((p) => (
        <ProductImageThumb key={p.id} product={p} size="sm" />
      ))}
      {products.length > 4 && (
        <span className="look-visual-more">+{products.length - 4}</span>
      )}
    </div>
  );
}
