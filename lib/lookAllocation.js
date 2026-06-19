// Per-look item allocation: units per person, role targeting, and spare stock.

import { crewLookIds, memberSets } from './crew.js';

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function slugifyRoleId(label = '') {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function defaultRoleIdsForProduct(product) {
  const tags = product?.roleTags || [];
  if (tags.length) return [...tags];
  return ['captain', 'chief-stew', 'interior', 'deck', 'chef', 'engineer', 'spa'];
}

export function normalizeLookItems(look = {}, productsById = {}) {
  const productIds = look.productIds || lookProductIdsFromItems(look);
  const existing = new Map((look.items || []).map((i) => [i.productId, i]));
  const items = productIds.map((productId) => {
    const prev = existing.get(productId);
    const product = productsById[productId];
    return {
      productId,
      unitsPerPerson: Math.max(1, num(prev?.unitsPerPerson, 1)),
      roleIds: prev?.roleIds?.length ? [...prev.roleIds] : defaultRoleIdsForProduct(product),
      spareQty: Math.max(0, num(prev?.spareQty, 0)),
    };
  });
  return { ...look, productIds, items };
}

function lookProductIdsFromItems(look) {
  if (!Array.isArray(look.items)) return [];
  return look.items.map((i) => i.productId).filter(Boolean);
}

export function crewEligibleForItem(member, look, item) {
  const assigned = crewLookIds(member);
  if (!assigned.includes(look.id)) return false;
  if (look.bodyType && member.bodyType && member.bodyType !== look.bodyType) return false;
  const roleIds = item?.roleIds || [];
  if (!roleIds.length) return true;
  return roleIds.includes(member.role);
}

export function countEligibleCrew(crew = [], look, item) {
  return crew.filter((member) => crewEligibleForItem(member, look, item)).length;
}

export function itemBaseQty(crew = [], look, item, settings = {}) {
  return crew
    .filter((member) => crewEligibleForItem(member, look, item))
    .reduce((sum, member) => sum + num(item.unitsPerPerson, 1) * memberSets(member, settings), 0);
}

export function itemOrderQty(crew = [], look, item, settings = {}) {
  return itemBaseQty(crew, look, item, settings) + Math.max(0, num(item.spareQty, 0));
}

export function looksUseItemAllocations(looks = []) {
  return looks.some((look) => Array.isArray(look.items) && look.items.length > 0);
}

export function mergeRoleOptions(builtinRoles = [], customRoles = []) {
  const seen = new Set();
  const merged = [];
  for (const role of [...builtinRoles, ...customRoles]) {
    if (!role?.id || seen.has(role.id)) continue;
    seen.add(role.id);
    merged.push(role);
  }
  return merged;
}
