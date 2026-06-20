/** Secure image loading for AI try-on — blocks arbitrary external URLs. */

import {
  FETCH_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_DIMENSION,
} from './tryOnConstants.js';

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^169\.254\./,
  /^metadata\.google\.internal$/i,
];

const APPROVED_HOST_SUFFIXES = [
  '.public.blob.vercel-storage.com',
  'cdn.shopify.com',
  'shopify.com',
  'myshopify.com',
  'marinayachtwear.com',
  'liquidyachtwear.com',
  'smallwoods.com',
  'crewalamode.com',
  'musto.com',
  'gillmarine.com',
  'dubarry.com',
  'oceanr.com',
  'waypointuae.com',
  'superyachtshop.com',
  'pinmaryachtsupply.com',
  'azurtex.com',
  'seadesign.it',
  'coco-kandy.com',
  'nauticrew.com',
  'oceanform.com',
  'mallorclothing.com',
  'ethicalyachtwear.com',
  'dwduniform.com',
  'allaroundtheyacht.com',
  'uniquecrew.com',
  'waveuniforms.com',
  'taylormadedesigns.co.uk',
];

function isBlockedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function isAllowedTryOnImagePath(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.includes('..')) return false;
  if (/^\/preview\//.test(path)) return true;
  if (/^\/products\//.test(path)) return true;
  if (/^\/api\/product-image/.test(path)) return true;
  return false;
}

export function isAllowedTryOnImageUrl(raw, origin) {
  if (!raw || typeof raw !== 'string') return false;

  if (raw.startsWith('/')) {
    return isAllowedTryOnImagePath(raw);
  }

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (isBlockedHost(url.hostname)) return false;

    const host = url.hostname.toLowerCase();
    if (origin) {
      try {
        const appHost = new URL(origin).hostname.toLowerCase();
        if (host === appHost) return true;
      } catch {
        // ignore invalid origin
      }
    }

    return APPROVED_HOST_SUFFIXES.some(
      (suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

function sniffImageMimeType(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function readImageDimensions(buffer, mimeType) {
  if (mimeType === 'image/png' && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + segmentLength;
    }
  }

  return { width: 0, height: 0 };
}

async function validateImageBuffer(buffer) {
  if (!buffer?.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds allowed size');
  }

  const mimeType = sniffImageMimeType(buffer);
  if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(mimeType)) {
    throw new Error('Unsupported image MIME type');
  }

  const { width, height } = readImageDimensions(buffer, mimeType);
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error('Image exceeds maximum dimensions');
  }

  return { mimeType, data: buffer.toString('base64') };
}

export function modelImagePath(bodyType, view) {
  const body = bodyType === 'man' ? 'man' : 'woman';
  const angle = view === 'back' ? 'back' : 'front';
  return `/preview/model-${body}-${angle}.png`;
}

export async function loadModelImage(bodyType, view, origin) {
  const path = modelImagePath(bodyType, view);
  return loadValidatedImage(path, origin);
}

export async function loadValidatedImage(src, origin) {
  if (!isAllowedTryOnImageUrl(src, origin) && !isAllowedTryOnImagePath(src)) {
    throw new Error('Image URL is not allowed');
  }

  const url = src.startsWith('/') ? `${origin}${src}` : src;
  const response = await fetch(url, {
    headers: { Accept: 'image/*' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error('Image redirects are not allowed');
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error('Response is not an image');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return validateImageBuffer(buffer);
}
