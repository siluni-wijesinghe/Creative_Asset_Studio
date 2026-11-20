import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { platformPresets } from "../config/platformPresets.js";
import { generatedDir } from "../config/paths.js";
import { createAsset } from "../services/imageProcessor.js";
import { buildAssetFilename, safeFilename, slugify } from "../services/filenameService.js";
import { NamePreviewRequestSchema } from "../schemas/namingSchemas.js";

// The naming choices that arrive with Generate (the platforms are sent separately)
const GenerationNamingSchema = NamePreviewRequestSchema.omit({ platforms: true });

export async function generateAssets(req, res, next) {
  // With upload.fields, Multer puts files in req.files, grouped by field name.
  // Each one is a list, so we take the first item. The logo may not exist.
  const imageFile = req.files?.image?.[0];
  const logoFile = req.files?.logo?.[0];

  try {
    if (!imageFile) {
      return res.status(400).json({ error: "No image was uploaded." });
    }

    // The platform list arrives as text like '["instagram","website"]'
    const platformIds = JSON.parse(req.body.platforms || "[]");
    const selected = platformPresets.filter((p) => platformIds.includes(p.id));

    if (selected.length === 0) {
      return res.status(400).json({ error: "Select at least one platform." });
    }

    // The logo placement arrives as text like '{"x":0.78,"y":0.78,"width":0.18}'
    let logoPlacement;
    try {
      logoPlacement = JSON.parse(req.body.logoPlacement);
    } catch {
      logoPlacement = undefined; // missing or broken: the default placement is used
    }

    // The naming choices arrive as JSON text. If they are missing, defaults are used.
    let naming = GenerationNamingSchema.parse({});
    if (req.body.naming) {
      try {
        naming = GenerationNamingSchema.parse(JSON.parse(req.body.naming));
      } catch {
        return res.status(400).json({ error: "The naming options were not valid." });
      }
    }

    // No product name given? Use the uploaded file's name:
    // "Strawberry Plant.png" becomes "strawberry-plant"
    const product =
      naming.product || slugify(path.parse(imageFile.originalname).name) || "product";

    // No naming choices at all? A photo with a logo is "branded", otherwise "product"
    const assetType = req.body.naming ? naming.assetType : logoFile ? "branded" : "product";

    // Each click gets its own folder so results never overwrite each other
    const jobId = randomUUID();
    const jobFolder = path.join(generatedDir, jobId);
    await fs.mkdir(jobFolder, { recursive: true });

    // Make all the versions at the same time
    const assets = await Promise.all(
      selected.map(async (preset) => {
        // The final name is built by our code from cleaned parts
        const fileName = buildAssetFilename({
          brand: naming.brand,
          product,
          platform: preset.id,
          assetType,
          version: naming.version,
          extension: preset.extension,
        });

        await createAsset(imageFile.path, preset, jobFolder, fileName, logoFile?.path, logoPlacement);

        return {
          id: preset.id,
          platform: preset.name,
          width: preset.width,
          height: preset.height,
          format: preset.format,
          fileName,
          url: `/generated/${jobId}/${fileName}`,
          downloadUrl: `/api/assets/download/${jobId}/${fileName}`,
        };
      })
    );

    // A name for the ZIP too: acme-blue-mug-product-v1-assets.zip
    const zipName = safeFilename(
      [naming.brand, product, assetType, `v${naming.version}`, "assets"].filter(Boolean).join(" "),
      "zip",
      "assets",
      100
    );

    res.json({ assets, zipName });
  } catch (error) {
    next(error); // hand the problem to the error handler in server.js
  } finally {
    // The original uploads were only temporary, so delete both
    for (const file of [imageFile, logoFile]) {
      if (file) await fs.unlink(file.path).catch(() => {});
    }
  }
}

// Sends a finished image to the browser as a download
export function downloadAsset(req, res) {
  // path.basename removes any "../" tricks, so nobody can reach files
  // outside the generated folder
  const jobId = path.basename(req.params.jobId);
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(generatedDir, jobId, fileName);

  // res.download sets the header that makes the browser save the file
  res.download(filePath, fileName, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ error: "File not found." });
    }
  });
}