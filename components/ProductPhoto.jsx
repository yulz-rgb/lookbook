'use client';

import { useEffect, useState } from 'react';
import { fitProductImage } from '../lib/previewImage';

export function ProductPhoto({ src, alt = '', className = 'product-photo-img' }) {
  const [displaySrc, setDisplaySrc] = useState(src || '');

  useEffect(() => {
    let alive = true;
    if (!src) {
      setDisplaySrc('');
      return undefined;
    }

    setDisplaySrc(src);
    fitProductImage(src).then((next) => {
      if (alive) setDisplaySrc(next);
    });

    return () => {
      alive = false;
    };
  }, [src]);

  if (!displaySrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={displaySrc} alt={alt} loading="lazy" decoding="async" />
  );
}
