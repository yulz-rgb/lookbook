import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const modelPreviewSource = readFileSync(
  join(process.cwd(), 'components', 'ModelPreview.jsx'),
  'utf8',
);

describe('ModelPreview overlay policy', () => {
  it('does not render GarmentLayer or manual garment overlays', () => {
    expect(modelPreviewSource).not.toContain('GarmentLayer');
    expect(modelPreviewSource).not.toContain('preview-garment-layer');
    expect(modelPreviewSource).not.toContain('fitProductImage');
    expect(modelPreviewSource).not.toContain('garmentLayers');
    expect(modelPreviewSource).not.toContain('previewAdjustments');
    expect(modelPreviewSource).not.toContain('AdjustPanel');
    expect(modelPreviewSource).not.toContain('Mannequin');
  });

  it('does not auto-generate on selection change', () => {
    expect(modelPreviewSource).not.toContain('AI_DEBOUNCE_MS');
    const effectBlocks = modelPreviewSource.split('useEffect(').slice(1);
    for (const block of effectBlocks) {
      const body = block.split('}, [')[0];
      expect(body.includes("fetch('/api/tryon'")).toBe(false);
      expect(body.includes("method: 'POST'")).toBe(false);
    }
    expect(modelPreviewSource).toContain('Generate realistic look');
  });

  it('shows AI disclaimer under generated imagery', () => {
    expect(modelPreviewSource).toContain(
      'AI visualisation — garment sizing and physical fit must be confirmed separately.',
    );
  });

  it('shows stale badge for previous generated look', () => {
    expect(modelPreviewSource).toContain('Previous generated look');
  });
});
