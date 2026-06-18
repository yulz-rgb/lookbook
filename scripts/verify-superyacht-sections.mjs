#!/usr/bin/env node
/** Audit Superyacht Shop import against nav-section listing counts. */
import { superyachtProducts } from '../lib/superyachtCatalog.js';
import { classifySuperyachtNavSection } from '../lib/catalogExtract.js';

const TARGET_SECTIONS = {
  ladies: 139,
  mens: 120,
  outerwear: 80,
  swim: 29,
  chefEngineer: 36,
  accessories: 73,
  guest: 7,
};

const EXCLUDED_PATH_RE = /\/clothing\/(beautician|recycled-sustainable)/;

const priority = ['guest', 'accessories', 'chefEngineer', 'swim', 'outerwear', 'ladies', 'mens', 'other'];
const sectionSets = Object.fromEntries(priority.map((k) => [k, new Set()]));

for (const product of superyachtProducts) {
  const url = String(product.productUrl || '');
  if (EXCLUDED_PATH_RE.test(url)) continue;
  const section = classifySuperyachtNavSection(product);
  sectionSets[section]?.add(url.replace(/\/$/, ''));
}

const assigned = new Map();
for (const section of priority) {
  for (const url of sectionSets[section] || []) {
    if (!assigned.has(url)) assigned.set(url, section);
  }
}

const counts = {};
for (const section of assigned.values()) {
  counts[section] = (counts[section] || 0) + 1;
}
counts.total = assigned.size;

console.log('Superyacht Shop — nav section audit\n');
console.log('| Section | Imported | GPT target |');
console.log('|---------|----------|------------|');
for (const [section, target] of Object.entries(TARGET_SECTIONS)) {
  const got = counts[section] || 0;
  const delta = got - target;
  const note = delta === 0 ? '=' : delta > 0 ? `+${delta}` : `${delta}`;
  console.log(`| ${section} | ${got} | ${target} (${note}) |`);
}
console.log(`| **total assigned** | **${counts.total}** | **484** |`);
console.log(`\nFull catalog import: ${superyachtProducts.length} unique products`);
console.log('GPT 484 = deduplicated nav snapshot; live site has more listings today.');
