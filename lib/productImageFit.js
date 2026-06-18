/** Trim white margins and key flat backgrounds from product image pixel data. */

export const KEY_THRESHOLD = 240;
export const TRIM_PADDING_RATIO = 0.02;

export function keyAlpha(r, g, b, a) {
  if (a <= 12) return 0;
  const min = Math.min(r, g, b);
  if (min >= KEY_THRESHOLD) return 0;
  if (min >= KEY_THRESHOLD - 12) {
    return Math.round(a * (KEY_THRESHOLD - min) / 12);
  }
  return a;
}

export function isVisibleProductPixel(r, g, b, a) {
  return keyAlpha(r, g, b, a) > 0;
}

export function findProductContentBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (isVisibleProductPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

export function trimBounds(bounds, width, height, paddingRatio = TRIM_PADDING_RATIO) {
  const contentWidth = bounds.maxX - bounds.minX + 1;
  const contentHeight = bounds.maxY - bounds.minY + 1;
  const padX = Math.round(contentWidth * paddingRatio);
  const padY = Math.round(contentHeight * paddingRatio);

  return {
    minX: Math.max(0, bounds.minX - padX),
    minY: Math.max(0, bounds.minY - padY),
    maxX: Math.min(width - 1, bounds.maxX + padX),
    maxY: Math.min(height - 1, bounds.maxY + padY),
  };
}

export function detectBackgroundColor(data, width, height, channels = 4) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
  ];
  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of points) {
    const i = (y * width + x) * channels;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  const count = points.length;
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

export function isContentAgainstBackground(r, g, b, a, bg, threshold = 28) {
  if (a <= 12) return false;
  return Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b) > threshold;
}

export function findTrimBounds(data, width, height, channels = 4, bg = null, threshold = 28) {
  const background = bg || detectBackgroundColor(data, width, height, channels);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      if (isContentAgainstBackground(
        data[i],
        data[i + 1],
        data[i + 2],
        channels === 4 ? data[i + 3] : 255,
        background,
        threshold,
      )) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY, background };
}

function cropImageData(data, width, height, channels, trimmed) {
  const cropWidth = trimmed.maxX - trimmed.minX + 1;
  const cropHeight = trimmed.maxY - trimmed.minY + 1;
  if (cropWidth <= 0 || cropHeight <= 0) return null;
  if (cropWidth === width && cropHeight === height) {
    return { data, width, height, channels };
  }

  const cropped = new Uint8ClampedArray(cropWidth * cropHeight * channels);
  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const src = ((trimmed.minY + y) * width + (trimmed.minX + x)) * channels;
      const dst = (y * cropWidth + x) * channels;
      for (let c = 0; c < channels; c += 1) {
        cropped[dst + c] = data[src + c];
      }
    }
  }

  return { data: cropped, width: cropWidth, height: cropHeight, channels };
}

export function trimProductImageMargins(data, width, height, channels = 4) {
  const bounds = findTrimBounds(data, width, height, channels);
  if (!bounds) return null;
  const trimmed = trimBounds(bounds, width, height);
  return cropImageData(data, width, height, channels, trimmed);
}

export function keyAndTrimProductImageData(data, width, height) {
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = keyAlpha(data[i], data[i + 1], data[i + 2], data[i + 3]);
  }

  const bounds = findProductContentBounds(data, width, height);
  if (!bounds) return null;

  const trimmed = trimBounds(bounds, width, height);
  const cropWidth = trimmed.maxX - trimmed.minX + 1;
  const cropHeight = trimmed.maxY - trimmed.minY + 1;
  if (cropWidth <= 0 || cropHeight <= 0) return null;
  if (cropWidth === width && cropHeight === height) {
    return { data, width, height, channels: 4 };
  }

  const cropped = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const src = ((trimmed.minY + y) * width + (trimmed.minX + x)) * 4;
      const dst = (y * cropWidth + x) * 4;
      cropped[dst] = data[src];
      cropped[dst + 1] = data[src + 1];
      cropped[dst + 2] = data[src + 2];
      cropped[dst + 3] = data[src + 3];
    }
  }

  return { data: cropped, width: cropWidth, height: cropHeight, channels: 4 };
}

/** @deprecated Use keyAndTrimProductImageData or trimProductImageMargins. */
export function processProductImageData(data, width, height) {
  return keyAndTrimProductImageData(data, width, height);
}
