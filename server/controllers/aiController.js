import { analyzeImage, generateDescription, generateAltText, AiError } from "../services/aiService.js";
import {
  ProductInfoSchema,
  DescriptionRequestSchema,
  AltTextRequestSchema,
} from "../schemas/aiSchemas.js";

// Problems we understand get a friendly message and the right status code.
// Anything else goes to the general error handler.
function handleError(error, res, next) {
  if (error instanceof AiError) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  next(error);
}

// POST /api/ai/analyze
export async function analyze(req, res, next) {
  try {
    // The photo is in memory (req.file.buffer), not saved to disk
    if (!req.file) {
      return res.status(400).json({ error: "No image was uploaded." });
    }

    // The product info arrives as JSON text in a form field. It may be missing.
    let productInfo = ProductInfoSchema.parse({});
    if (req.body.productInfo) {
      try {
        productInfo = ProductInfoSchema.parse(JSON.parse(req.body.productInfo));
      } catch {
        return res.status(400).json({ error: "The product info was not valid." });
      }
    }

    const analysis = await analyzeImage(req.file.buffer, productInfo);
    res.json({ analysis });
  } catch (error) {
    handleError(error, res, next);
  }
}

// POST /api/ai/description
export async function description(req, res, next) {
  try {
    // Never trust what the browser sends: check its shape and sizes
    const parsed = DescriptionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "The request was not valid." });
    }
    const items = await generateDescription(parsed.data);
    res.json({ items });
  } catch (error) {
    handleError(error, res, next);
  }
}

// POST /api/ai/alt-text
export async function altText(req, res, next) {
  try {
    const parsed = AltTextRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "The request was not valid." });
    }
    const item = await generateAltText(parsed.data);
    res.json({ item });
  } catch (error) {
    handleError(error, res, next);
  }
}