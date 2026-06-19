'use client';

import { useEffect, useState } from 'react';
import { fitProductImage } from '../lib/previewImage';

export function ProductPhoto({ src, alt = '', className = 'product-photo-img' }) {
  // Only the async-fitted result lives in state, keyed by the src it was computed for.
  // The immediate display value is derived during render to avoid setState-in-effect.
  const [fitted, setFitted] = useState({ src: null, value: null });

  useEffect(() => {
    if (!src) return undefined;
    let alive = true;
    fitProductImage(src).then((next) => {
      if (alive) setFitted({ src, value: next });
    });

    return () => {
      alive = false;
    };
  }, [src]);

  const displaySrc = src ? (fitted.src === src && fitted.value ? fitted.value : src) : '';
  if (!displaySrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={displaySrc} alt={alt} loading="lazy" decoding="async" />
  );
}
