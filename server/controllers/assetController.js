import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { platformPresets } from "../config/platformPresets.js";
import { generatedDir } from "../config/paths.js";
import { createAsset } from "../services/imageProcessor.js";

export async function generateAssets(req, res, next) {
  try {
    // Multer put the uploaded file on req.file. No file means nothing to process.
    if (!req.file) {
      return res.status(400).json({ error: "No image was uploaded." });
    }

    // The platform list arrives as text like '["instagram","website"]'
    const platformIds = JSON.parse(req.body.platforms || "[]");
    const selected = platformPresets.filter((p) => platformIds.includes(p.id));

    if (selected.length === 0) {
      return res.status(400).json({ error: "Select at least one platform." });
    }

    // Each click gets its own folder so results never overwrite each other
    const jobId = randomUUID();
    const jobFolder = path.join(generatedDir, jobId);
    await fs.mkdir(jobFolder, { recursive: true });

    // Use the original name for the files: "Strawberry Plant.png" -> "strawberry-plant"
    const baseName =
      path
        .parse(req.file.originalname)
        .name.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "product";

    // Make all the versions at the same time
    const assets = await Promise.all(
      selected.map(async (preset) => {
        const { fileName } = await createAsset(req.file.path, preset, jobFolder, baseName);
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

    res.json({ assets });
  } catch (error) {
    next(error); // hand the problem to the error handler in server.js
  } finally {
    // The original upload was only temporary, so delete it
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
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