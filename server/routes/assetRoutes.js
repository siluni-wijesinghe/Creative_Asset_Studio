import express from "express";
import multer from "multer";
import { uploadsDir } from "../config/paths.js";
import { generateAssets } from "../controllers/assetController.js";

const router = express.Router();

const upload = multer({
  dest: uploadsDir,                       // where uploads are saved temporarily
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB maximum
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("UNSUPPORTED_TYPE"));
  },
});

// POST /api/assets/generate. "image" must match the field name React sends.
router.post("/generate", upload.single("image"), generateAssets);

export default router;