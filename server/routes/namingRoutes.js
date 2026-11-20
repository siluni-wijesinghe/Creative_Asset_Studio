import express from "express";
import { previewNames } from "../controllers/namingController.js";

const router = express.Router();

router.post("/preview", previewNames);

export default router;