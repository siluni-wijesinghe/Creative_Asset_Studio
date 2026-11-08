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

// ---------------------------------------------------------------
// Phase 2: descriptions and alt text
// ---------------------------------------------------------------

// The tones the user can choose. The server is the source of truth.
export const TONES = ["professional", "friendly", "minimal", "premium", "promotional"];

export const DESCRIPTION_FIELDS = ["short", "ecommerce", "oneLine"];

// Longest allowed text for each field (we shorten anything longer)
export const DESCRIPTION_LIMITS = { short: 300, ecommerce: 1200, oneLine: 120 };

// The shape we ask Gemini to answer in
export const ProductDescriptionSchema = z.object({
  short: z.string().describe("1-2 sentences, up to 40 words"),
  ecommerce: z
    .string()
    .describe("A product page description of 60-110 words in 1-2 short paragraphs"),
  oneLine: z.string().describe("A single-line summary of at most 100 characters"),
});

export const AltTextSchema = z.object({
  altText: z.string().describe("One concise sentence describing only what is visible"),
});

// The analysis comes back from the browser, so we check it again.
// It mirrors what normalizeAnalysis() produces, with size limits.
const text = (max) => z.string().max(max);
export const AnalysisInputSchema = z.object({
  isProduct: z.boolean(),
  productName: text(100),
  category: text(60),
  visibleCharacteristics: z.array(text(100)).max(8),
  colors: z.array(text(30)).max(6),
  material: text(60),
  brand: text(60),
  visibleText: z.array(text(80)).max(6),
  summary: text(300),
  keywords: z.array(text(40)).max(10),
  tags: z.array(text(41)).max(8),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(text(120)).max(5),
  userProvided: z.object({ brand: z.boolean(), productName: z.boolean() }),
});

// What the browser may send to each endpoint
export const DescriptionRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  productInfo: ProductInfoSchema.default({ brand: "", name: "", notes: "" }),
  tone: z.enum(TONES),
  field: z.enum(["all", ...DESCRIPTION_FIELDS]).default("all"),
  previous: z.string().max(1500).optional(), // the old text, so Regenerate can differ
});

export const AltTextRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  previous: z.string().max(500).optional(),
});

// ---- Tidy-up for the generated texts ----

// Removes markdown symbols and extra spaces, then shortens
export function cleanContentText(value, maxLength) {
  return String(value ?? "")
    .replace(/[*#`_]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

// Alt text rules: no "Image of" opener, starts with a capital, ends with a period
export function cleanAltText(value) {
  let altText = String(value ?? "").replace(/\s+/g, " ").trim();
  altText = altText.replace(
    /^(?:an?\s+)?(?:image|photo|picture|photograph)\s+of\s+(?:an?\s+|the\s+)?/i,
    ""
  );
  altText = altText.slice(0, 150);
  if (!altText) return "";
  altText = altText.charAt(0).toUpperCase() + altText.slice(1);
  return /[.!?]$/.test(altText) ? altText : altText + ".";
}
// ---------------------------------------------------------------
// Phase 3: social captions
// ---------------------------------------------------------------

import { captionPlatforms } from "../config/captionPlatforms.js";

export const CAPTION_TONES = ["professional", "friendly", "promotional", "minimal"];

// The shape we ask Gemini to answer in
export const SocialCaptionSchema = z.object({
  caption: z.string().describe("The caption text only. No hashtags inside it."),
  hashtags: z
    .array(z.string())
    .describe("Relevant hashtags built from the facts only, such as product type or colors"),
});

// What the browser may send to POST /api/ai/caption
export const CaptionRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  productInfo: ProductInfoSchema.default({ brand: "", name: "", notes: "" }),
  platform: z.enum(Object.keys(captionPlatforms)),
  tone: z.enum(CAPTION_TONES),
  includeHashtags: z.boolean().default(false),
  previous: z.string().max(2500).optional(), // the old text, so Regenerate can differ
});

// Hashtags: letters and numbers only, one leading "#", no duplicates, limited count
export function cleanHashtags(list, max) {
  const seen = new Set();
  const tags = [];
  for (const tag of list) {
    const cleaned = String(tag).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
    if (!cleaned || seen.has(cleaned.toLowerCase())) continue;
    seen.add(cleaned.toLowerCase());
    tags.push("#" + cleaned);
    if (tags.length === max) break;
  }
  return tags;
}

// Shortens a text to fit, ending at a full sentence when possible
export function truncateAtSentence(text, maxLength) {
  if (text.length <= maxLength) return { text, shortened: false };

  const cut = text.slice(0, maxLength);
  const lastEnd = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  const result = lastEnd > maxLength * 0.5 ? cut.slice(0, lastEnd + 1) : cut.trimEnd();
  return { text: result, shortened: true };
}
// ---------------------------------------------------------------
// Phase 4: SEO metadata
// ---------------------------------------------------------------

export const SEO_FIELDS = ["seoTitle", "metaDescription", "keywords", "filenameSuggestion"];

// Common rules of thumb. Search engines actually cut by display width, not by count.
export const SEO_LIMITS = { seoTitle: 60, metaDescription: 155 };

// The shape we ask Gemini to answer in
export const SeoSchema = z.object({
  seoTitle: z
    .string()
    .describe("A page title of at most 60 characters: product type plus one key visible detail"),
  metaDescription: z
    .string()
    .describe("A factual one or two sentence summary of 120 to 155 characters"),
  keywords: z
    .array(z.string())
    .describe("5 to 8 lowercase search phrases a shopper might type, built from the facts only"),
  filenameSuggestion: z
    .string()
    .describe("3 to 6 lowercase words joined by hyphens naming the product. No brand, no extension"),
});

// What the browser may send to POST /api/ai/seo
export const SeoRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  productInfo: ProductInfoSchema.default({ brand: "", name: "", notes: "" }),
  field: z.enum(["all", ...SEO_FIELDS]).default("all"),
  previous: z.string().max(500).optional(), // the old text, so Regenerate can differ
});

// Shortens a text to fit: at a sentence end if possible, otherwise at a word end
export function shortenText(text, maxLength) {
  if (text.length <= maxLength) return { text, shortened: false };

  const cut = text.slice(0, maxLength);
  const lastEnd = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (lastEnd > maxLength * 0.6) {
    return { text: cut.slice(0, lastEnd + 1), shortened: true };
  }

  const lastSpace = cut.lastIndexOf(" ");
  const result = lastSpace > maxLength * 0.4 ? cut.slice(0, lastSpace) : cut;
  return { text: result.replace(/[\s,;:\-–]+$/, ""), shortened: true };
}

// Keywords: lowercase, no commas, no duplicates, limited count
export function cleanKeywordList(list, max) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const text = String(item ?? "")
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .slice(0, 40);
    if (!text || text === "unknown" || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length === max) break;
  }
  return result;
}