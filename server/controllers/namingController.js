import { platformPresets } from "../config/platformPresets.js";
import { buildAssetFilename } from "../services/filenameService.js";
import { NamePreviewRequestSchema } from "../schemas/namingSchemas.js";

// POST /api/naming/preview
// Returns the final file name for each platform. No AI is involved.
export function previewNames(req, res) {
  const parsed = NamePreviewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "The naming request was not valid." });
  }

  const { brand, product, assetType, version, platforms } = parsed.data;

  // Use the platforms the browser asked for, or all of them
  const presets = platforms
    ? platformPresets.filter((preset) => platforms.includes(preset.id))
    : platformPresets;

  const names = presets.map((preset) => ({
    id: preset.id,
    platform: preset.name,
    filename: buildAssetFilename({
      brand,
      product,
      platform: preset.id,
      assetType,
      version,
      extension: preset.extension,
    }),
  }));

  res.json({ names });
}