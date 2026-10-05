import sharp from "sharp";
import path from "path";

// Creates ONE finished image for ONE platform preset.
export async function createAsset(inputPath, preset, outputFolder, baseName) {
  // Example: strawberry-plant-instagram-1080x1080.jpg
  const fileName = `${baseName}-${preset.id}-${preset.width}x${preset.height}.${preset.extension}`;
  const outputPath = path.join(outputFolder, fileName);

  await sharp(inputPath)
    .rotate() // fixes photos that are sideways because of phone orientation data
    .resize(preset.width, preset.height, {
      fit: "cover",         // fill the whole frame and crop the extra, without stretching
      position: "centre",   // crop equally from both sides
    })
    .flatten({ background: "#ffffff" }) // PNG transparency becomes white instead of black
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  return { fileName, outputPath };
}