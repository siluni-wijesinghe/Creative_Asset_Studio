import { analyzeImage, AiError } from "../services/aiService.js";
import { ProductInfoSchema } from "../schemas/aiSchemas.js";

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
    // Problems we understand get a friendly message and the right status code
    if (error instanceof AiError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    next(error); // anything else goes to the general error handler
  }
}