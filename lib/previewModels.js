export function getPreviewModelSrc(bodyType, view = 'front') {
  const side = view === 'back' ? 'back' : 'front';
  return `/preview/model-${bodyType}-${side}.jpg`;
}

export const PREVIEW_BASE_SCALE = 2.5;
