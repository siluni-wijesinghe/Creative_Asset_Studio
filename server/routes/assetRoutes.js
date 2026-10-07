import express from "express";
import multer from "multer";
import { uploadsDir } from "../config/paths.js";
import { generateAssets, downloadAsset } from "../controllers/assetController.js";

const router = express.Router();

const upload = multer({
  dest: uploadsDir,                       // where uploads are saved temporarily
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB maximum per file
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("UNSUPPORTED_TYPE"));
  },
});

// Accept two named files: the product image and an optional logo.
// The names "image" and "logo" must match what React sends.
const uploadFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "logo", maxCount: 1 },
]);

// POST /api/assets/generate
router.post("/generate", uploadFiles, generateAssets);

// GET /api/assets/download/<job>/<file> saves the image to the user's computer
router.get("/download/:jobId/:fileName", downloadAsset);

export default router;