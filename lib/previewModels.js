export function getPreviewModelSrc(bodyType, view = 'front') {
  const side = view === 'back' ? 'back' : 'front';
  return `/preview/cutout-${bodyType}-${side}.png`;
}

/** Preview frame and figure-stack dimensions (must match app/globals.css). */
export const PREVIEW_FRAME_SIZE = 480;
export const PREVIEW_STACK_HEIGHT = 360;
export const PREVIEW_MANNEQUIN_HEIGHT = 340;
/** Default: figure fills ~90% of the preview frame height. */
export const PREVIEW_FILL_RATIO = 0.9;
export const PREVIEW_BASE_SCALE = (PREVIEW_FRAME_SIZE * PREVIEW_FILL_RATIO) / PREVIEW_STACK_HEIGHT;
