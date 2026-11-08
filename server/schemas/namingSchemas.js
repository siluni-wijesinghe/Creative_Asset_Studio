import { z } from "zod";
import { ASSET_TYPES, MAX_VERSION } from "../config/naming.js";

// What the browser may send to POST /api/naming/preview
export const NamePreviewRequestSchema = z.object({
  brand: z.string().trim().max(60).default(""),
  product: z.string().trim().max(100).default(""),
  assetType: z.enum(ASSET_TYPES).default("product"),
  version: z.number().int().min(1).max(MAX_VERSION).default(1),
  platforms: z.array(z.string().max(30)).max(10).optional(), // platform ids; all if missing
});