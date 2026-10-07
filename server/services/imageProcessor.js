import sharp from "sharp";
import path from "path";

// Used when the browser sends no placement (or a broken one).
// The numbers are fractions of the image, the same as in the editor.
const DEFAULT_PLACEMENT = { x: 0.78, y: 0.78, width: 0.18 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Fills in anything missing and ignores values that aren't real numbers
function readPlacement(raw) {
  const placement = { ...DEFAULT_PLACEMENT, ...raw };
  for (const key of ["x", "y", "width"]) {
    if (!Number.isFinite(placement[key])) placement[key] = DEFAULT_PLACEMENT[key];
  }
  return placement;
}

// Creates ONE finished image for ONE platform preset.
// logoPath and logoPlacement are optional.
export async function createAsset(
  inputPath,
  preset,
  outputFolder,
  baseName,
  logoPath,
  logoPlacement
) {
  const fileName = `${baseName}-${preset.id}-${preset.width}x${preset.height}.${preset.extension}`;
  const outputPath = path.join(outputFolder, fileName);

  // Step 1: resize and crop the product image
  let image = sharp(inputPath)
    .rotate() // fixes photos that are sideways because of phone orientation data
    .resize(preset.width, preset.height, {
      fit: "cover",
      position: "centre",
    })
    .flatten({ background: "#ffffff" }); // transparency becomes white instead of black

  // Step 2: if there's a logo, resize it and place it where the user put it
  if (logoPath) {
    const placement = readPlacement(logoPlacement);

    // Convert the logo width from a fraction to pixels for THIS platform
    const logoWidth = Math.round(preset.width * clamp(placement.width, 0.05, 1));

    const { data: logoBuffer, info } = await sharp(logoPath)
      .resize({
        width: logoWidth,
        height: preset.height, // a very tall logo is never taller than the image
        fit: "inside",         // keep the logo's shape
      })
      .png()
      .toBuffer({ resolveWithObject: true }); // "info" tells us the final logo size

    // Convert the position to pixels, and keep the logo fully inside the image
    const left = clamp(Math.round(preset.width * placement.x), 0, preset.width - info.width);
    const top = clamp(Math.round(preset.height * placement.y), 0, preset.height - info.height);

    image = image.composite([{ input: logoBuffer, left, top }]);
  }

  // Step 3: save as JPEG
  await image.jpeg({ quality: 90 }).toFile(outputPath);

  return { fileName, outputPath };
}