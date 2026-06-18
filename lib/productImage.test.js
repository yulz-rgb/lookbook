import { describe, it, expect, vi, afterEach } from 'vitest';
import { attachProductImage } from './productImage.js';

function mockLocalImagePipeline(dataUrl = 'data:image/jpeg;base64,compressed') {
  class FakeImage {
    set src(_value) {
      this.width = 1200;
      this.height = 900;
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal('document', {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toDataURL: () => dataUrl,
    }),
  });
}

describe('attachProductImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects non-image files', async () => {
    await expect(
      attachProductImage({ type: 'text/plain', size: 10 }, { canUpload: false }),
    ).rejects.toThrow(/image file/i);
  });

  it('rejects files over 8 MB', async () => {
    await expect(
      attachProductImage({ type: 'image/png', size: 9 * 1024 * 1024 }, { canUpload: false }),
    ).rejects.toThrow(/too large/i);
  });

  it('uploads via /api/upload when canUpload is true', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://blob.example/products/polo.jpg' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['pixels'], 'polo.jpg', { type: 'image/jpeg' });
    const url = await attachProductImage(file, { canUpload: true });

    expect(url).toBe('https://blob.example/products/polo.jpg');
    expect(fetchMock).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces API upload errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Blob storage not configured' }),
    }));

    const file = new File(['pixels'], 'polo.jpg', { type: 'image/jpeg' });
    await expect(attachProductImage(file, { canUpload: true })).rejects.toThrow(/Blob storage/);
  });

  it('returns a compressed JPEG data URL in local mode', async () => {
    mockLocalImagePipeline();

    const file = new File(['pixels'], 'polo.jpg', { type: 'image/jpeg' });
    const url = await attachProductImage(file, { canUpload: false });

    expect(url).toBe('data:image/jpeg;base64,compressed');
  });
});
