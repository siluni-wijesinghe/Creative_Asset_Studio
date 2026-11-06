import { z } from "zod";

// What the user typed in the "Product info" form. We trust this as given.
export const ProductInfoSchema = z.object({
  brand: z.string().trim().max(60).default(""),
  name: z.string().trim().max(100).default(""),
  notes: z.string().trim().max(500).default(""),
});

// The shape we ask Gemini to answer in. The .describe() texts are sent to
// the model too, so they work like extra instructions for each field.
export const ProductAnalysisSchema = z.object({
  isProduct: z
    .boolean()
    .describe("true only if the photo mainly shows a product (or a set sold together)"),
  productName: z
    .string()
    .describe('Plain generic name of the product, e.g. "ceramic coffee mug", or "unknown"'),
  category: z.string().describe('Broad product category, or "unknown"'),
  visibleCharacteristics: z
    .array(z.string())
    .describe("Short phrases about what is clearly visible: shape, pattern, parts"),
  colors: z.array(z.string()).describe("Main visible colors"),
  material: z
    .string()
    .describe('Material only if it can reasonably be identified by looking, otherwise "unknown"'),
  brand: z
    .string()
    .describe('Brand only if a brand name is clearly readable in the image, otherwise "unknown"'),
  visibleText: z
    .array(z.string())
    .describe("Words that are clearly readable on the product or packaging"),
  summary: z
    .string()
    .describe("One factual sentence describing what the photo shows, with no marketing language"),
  keywords: z.array(z.string()).describe("Search keywords a shopper might use, from visible facts only"),
  tags: z.array(z.string()).describe("Hashtag-style tags from visible facts only"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("0 to 1: how sure you are. Lower it for blurry, dark, cluttered or ambiguous photos"),
  uncertainties: z
    .array(z.string())
    .describe("Things you could NOT determine from the photo, or reasons for doubt"),
});

// ---- Tidy-up helpers (our own code, not the AI) ----

const UNKNOWN = "unknown";

function squash(value, maxLength) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

// One text value: trimmed, shortened, and "unknown" if empty
function cleanText(value, maxLength) {
  const text = squash(value, maxLength);
  if (!text || text.toLowerCase() === UNKNOWN) return UNKNOWN;
  return text;
}

// A list: trimmed, no empty items, no duplicates, limited length and count
function cleanList(list, maxItems, maxLength) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const text = squash(item, maxLength);
    if (!text || text.toLowerCase() === UNKNOWN || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    result.push(text);
    if (result.length === maxItems) break;
  }
  return result;
}

// Turns whatever passed validation into the final, tidy analysis object
export function normalizeAnalysis(raw) {
  // Hashtags: letters and numbers only, one leading "#", no duplicates
  const tags = [];
  const seenTags = new Set();
  for (const tag of raw.tags) {
    const cleaned = String(tag).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
    if (!cleaned || seenTags.has(cleaned.toLowerCase())) continue;
    seenTags.add(cleaned.toLowerCase());
    tags.push("#" + cleaned);
    if (tags.length === 8) break;
  }

  return {
    isProduct: raw.isProduct,
    productName: cleanText(raw.productName, 100),
    category: cleanText(raw.category, 60),
    visibleCharacteristics: cleanList(raw.visibleCharacteristics, 8, 100),
    colors: cleanList(raw.colors, 6, 30).map((c) => c.toLowerCase()),
    material: cleanText(raw.material, 60),
    brand: cleanText(raw.brand, 60),
    visibleText: cleanList(raw.visibleText, 6, 80),
    summary: cleanText(raw.summary, 300),
    keywords: cleanList(raw.keywords, 10, 40).map((k) => k.toLowerCase()),
    tags,
    confidence: Math.min(Math.max(raw.confidence, 0), 1),
    uncertainties: cleanList(raw.uncertainties, 5, 120),
  };
}