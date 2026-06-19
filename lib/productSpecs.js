import { extractFabricFromDescription } from './catalogExtract.js';
import { cleanFabricComposition } from './fabric.js';

function nonEmpty(value) {
  return String(value ?? '').trim();
}

function trimFabricClause(raw) {
  return String(raw || '')
    .replace(/\b(?:medium|lightweight|heavy)\s+weight\b[\s\S]*$/i, '')
    .replace(/\b(?:weight|styling|care)\b[\s\S]*$/i, '')
    .trim();
}

function extractFabricClause(details) {
  const match = String(details || '').match(/\bFabric:\s*([^.\n]+)/i);
  if (!match?.[1]) return '';
  return trimFabricClause(match[1]);
}

export function resolveProductFabric(product = {}) {
  const fabricField = nonEmpty(product.fabric);
  if (fabricField) {
    const cleaned = cleanFabricComposition(fabricField);
    if (cleaned) return cleaned;
  }

  const details = nonEmpty(product.details);
  if (!details) return '';

  const clause = extractFabricClause(details);
  if (clause) {
    const cleaned = cleanFabricComposition(clause);
    if (cleaned) return cleaned;
  }

  const extracted = extractFabricFromDescription(details);
  if (extracted) return extracted;

  const cleaned = cleanFabricComposition(details);
  return cleaned || '';
}

export function resolveProductSizeRange(product = {}) {
  const direct = nonEmpty(product.sizeRange);
  if (direct) return direct;

  const details = nonEmpty(product.details);
  if (!details) return '';

  const match = details.match(
    /\bSIZES?:\s*(.+?)(?=\s+(?:FABRIC|COLOURS?|COLOUR|CARE(?:\s+INSTRUCTIONS?)?|MATERIAL|STYLING)\s*:|$)/i,
  );
  if (!match?.[1]) return '';

  return match[1]
    .replace(/\s*(?:Care|Matching)\b[\s\S]*$/i, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '–');
}

export function formatFabricDisplay(input) {
  const raw = typeof input === 'object' && input !== null
    ? resolveProductFabric(input)
    : cleanFabricComposition(input);
  if (!raw) return '—';
  return raw.replace(/\s*&\s*/g, ' / ');
}

export function formatSizeDisplay(input) {
  const raw = typeof input === 'object' && input !== null
    ? resolveProductSizeRange(input)
    : String(input || '').trim();
  if (!raw) return '—';
  if (/^1\s*size$/i.test(raw)) return 'One size';
  return raw;
}
