import { cleanFabricComposition } from './fabric.js';

export function formatFabricDisplay(fabric) {
  const cleaned = cleanFabricComposition(fabric);
  if (!cleaned) return '—';
  return cleaned.replace(/\s*&\s*/g, ' / ');
}

export function formatSizeDisplay(sizeRange) {
  const raw = String(sizeRange || '').trim();
  if (!raw) return '—';
  if (/^1\s*size$/i.test(raw)) return 'One size';
  return raw;
}
