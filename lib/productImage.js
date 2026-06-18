// Client-side product photo handling: Blob upload when configured, else compressed data URL for local mode.

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const LOCAL_TARGET_CHARS = 520_000;

export async function attachProductImage(file, { canUpload }) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, etc.)');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image too large (max 8 MB)');
  }

  if (canUpload) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  return compressToDataUrl(file);
}

function compressToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxW = 800;
      const scale = Math.min(1, maxW / Math.max(img.width, 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > LOCAL_TARGET_CHARS && quality > 0.35) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read that image'));
    };
    img.src = objectUrl;
  });
}
