// Where the logo goes, as fractions of the image (0 to 1):
//   x, y  = the logo's top-left corner
//   width = the logo's width (its height follows its shape)
// This matches the old "medium, bottom-right" look.
export const DEFAULT_LOGO_PLACEMENT = { x: 0.78, y: 0.78, width: 0.18 };

export const MIN_LOGO_WIDTH = 0.05; // the logo can't shrink below 5% of the width

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Keeps the logo fully inside the image.
// heightPerWidth tells us how tall the logo is compared to its width,
// measured in image fractions. It changes with the preview shape.
export function fitInside(placement, heightPerWidth) {
  const maxWidth = Math.min(1, 1 / heightPerWidth);
  const width = clamp(placement.width, MIN_LOGO_WIDTH, maxWidth);
  const height = width * heightPerWidth;

  return {
    width,
    x: clamp(placement.x, 0, 1 - width),
    y: clamp(placement.y, 0, 1 - height),
  };
}