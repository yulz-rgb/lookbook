// Vercel Blob upload helper for product imagery and export artifacts.
import { put } from '@vercel/blob';
import { hasBlob } from './config';

export async function uploadBlob(pathname, data, { contentType } = {}) {
  if (!hasBlob) {
    throw new Error('Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing).');
  }
  const result = await put(pathname, data, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });
  return result.url;
}
