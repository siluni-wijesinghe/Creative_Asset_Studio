import express from "express";
import multer from "multer";
import { analyze, description, altText, caption, seo } from "../controllers/aiController.js";
import { aiRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

// Keep the upload in memory: we only need it for a moment
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("UNSUPPORTED_TYPE"));
  },
});

// The rate limit runs first, so blocked visitors never upload anything
router.post("/analyze", aiRateLimit, upload.single("image"), analyze);
router.post("/description", aiRateLimit, description);
router.post("/alt-text", aiRateLimit, altText);
router.post("/caption", aiRateLimit, caption);
router.post("/seo", aiRateLimit, seo);

export default router;