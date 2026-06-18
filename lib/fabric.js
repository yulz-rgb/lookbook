const FABRIC_PART_RE = /(\d+(?:\.\d+)?)\s*%\s*([a-z][a-z0-9\s\-/®™']*?)(?=\s*(?:,|&|\/|\d+\s*%|\bwith\b|\.|;|$)|\s+(?:and|blend|material|weight)\b)/gi;

const MATERIAL_STOP_RE = /\b(?:outer|inner|shell|blend|with|for|ensuring|that|this|these|offering|providing|delivering|weight|construction|lining|layer|bonded|ideal|unit)\b/i;

const SPEC_SECTION_RE = /\b(?:solid colors?|marl|filling|warmth|fit|sizes?|colors? available|care instructions|certifications?|size guide|fastening|pocket|durability|design|finish|ethics|features?|sun protection|material(?:\s+weight)?)\s*:/i;

function normalizeMaterialName(raw) {
  let material = String(raw || '').trim().replace(/\s+/g, ' ');
  const dashSpec = material.search(/\s+-\s*\d/);
  if (dashSpec > 0) material = material.slice(0, dashSpec).trim();
  const stop = material.search(MATERIAL_STOP_RE);
  if (stop > 0) material = material.slice(0, stop).trim();
  return material.replace(/[,;.\s]+$/, '').toLowerCase();
}

/** Keep only percentage + material pairs, joined with " & ". */
export function cleanFabricComposition(raw) {
  let text = String(raw || '')
    .replace(/[–—]/g, '-')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';

  const specCut = text.search(SPEC_SECTION_RE);
  if (specCut > 0) text = text.slice(0, specCut).trim();

  const parts = [];
  let match;
  FABRIC_PART_RE.lastIndex = 0;
  while ((match = FABRIC_PART_RE.exec(text)) !== null) {
    const material = normalizeMaterialName(match[2]);
    if (!material) continue;
    const entry = `${match[1]}% ${material}`;
    if (!parts.includes(entry)) parts.push(entry);
  }

  return parts.join(' & ');
}
