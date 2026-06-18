import sharp from 'sharp';
import { trimProductImageMargins } from '../../../lib/productImageFit.js';

const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12000;

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;
  if (host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
  if (/^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

export function isAllowedProductImageUrl(raw) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (isBlockedHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fitRemoteProductImage(buffer) {
  const image = sharp(buffer).rotate();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);
  const processed = trimProductImageMargins(pixels, info.width, info.height, info.channels);
  if (!processed) {
    return image.png().toBuffer();
  }

  return sharp(Buffer.from(processed.data), {
    raw: {
      width: processed.width,
      height: processed.height,
      channels: processed.channels,
    },
  }).png().toBuffer();
}

export async function GET(req) {
  const src = req.nextUrl.searchParams.get('url');
  if (!src || !isAllowedProductImageUrl(src)) {
    return new Response('Invalid image URL', { status: 400 });
  }

  try {
    const response = await fetch(src, {
      headers: { Accept: 'image/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!response.ok) {
      return new Response('Image not found', { status: 404 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return new Response('Image too large', { status: 413 });
    }

    const png = await fitRemoteProductImage(buffer);
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Failed to process image', { status: 502 });
  }
}
