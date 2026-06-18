/** Per-product garment slot tweaks for the model preview (stored in localStorage). */

export const PREVIEW_ADJUSTMENTS_KEY = 'yacht-preview-adjustments-v1';

export const NUDGE = {
  position: 0.5,
  size: 0.5,
  scale: 0.05,
};

export function adjustmentKey(productId, bodyType, view) {
  return `${productId}:${bodyType}:${view === 'back' ? 'back' : 'front'}`;
}

export function loadPreviewAdjustments() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PREVIEW_ADJUSTMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistAdjustments(all) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREVIEW_ADJUSTMENTS_KEY, JSON.stringify(all));
}

function cleanAdjustment(record = {}) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => typeof value === 'number' && value !== 0),
  );
}

export function getPreviewAdjustment(productId, bodyType, view, store = null) {
  const all = store ?? loadPreviewAdjustments();
  return all[adjustmentKey(productId, bodyType, view)] || {};
}

export function patchPreviewAdjustment(productId, bodyType, view, patch) {
  const all = loadPreviewAdjustments();
  const key = adjustmentKey(productId, bodyType, view);
  const merged = cleanAdjustment({ ...(all[key] || {}), ...patch });
  if (Object.keys(merged).length) all[key] = merged;
  else delete all[key];
  persistAdjustments(all);
  return all;
}

export function nudgePreviewAdjustment(productId, bodyType, view, field, delta) {
  const current = getPreviewAdjustment(productId, bodyType, view);
  return patchPreviewAdjustment(productId, bodyType, view, {
    [field]: (current[field] || 0) + delta,
  });
}

export function resetPreviewAdjustment(productId, bodyType, view) {
  const all = loadPreviewAdjustments();
  delete all[adjustmentKey(productId, bodyType, view)];
  persistAdjustments(all);
  return all;
}

export function resetAllPreviewAdjustments() {
  persistAdjustments({});
  return {};
}

/** Merge saved deltas onto a computed slot. */
export function applyPreviewAdjustment(slot, adjustment = {}) {
  if (!adjustment || !Object.keys(adjustment).length) return slot;
  const next = { ...slot };
  if (typeof adjustment.topDelta === 'number') next.top = slot.top + adjustment.topDelta;
  if (typeof adjustment.leftDelta === 'number') next.left = slot.left + adjustment.leftDelta;
  if (typeof adjustment.widthDelta === 'number') next.width = slot.width + adjustment.widthDelta;
  if (typeof adjustment.heightDelta === 'number') next.height = slot.height + adjustment.heightDelta;
  if (typeof adjustment.scaleDelta === 'number') next.scale = (slot.scale || 1) + adjustment.scaleDelta;
  return next;
}
