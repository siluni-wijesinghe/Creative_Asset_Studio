import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { z } from "zod";
import { aiConfig } from "../config/ai.js";
import {
  ProductAnalysisSchema,
  ProductDescriptionSchema,
  AltTextSchema,
  DESCRIPTION_FIELDS,
  DESCRIPTION_LIMITS,
  normalizeAnalysis,
  cleanContentText,
  cleanAltText,
} from "../schemas/aiSchemas.js";
import { analysisSystemInstruction, buildAnalysisPrompt } from "../prompts/analysisPrompt.js";
import {
  buildFacts,
  buildAltFacts,
  descriptionSystemInstruction,
  altTextSystemInstruction,
  buildDescriptionPrompt,
  buildAltTextPrompt,
} from "../prompts/contentPrompts.js";
import { findUnsupportedFacts } from "./contentChecks.js";
import { SocialCaptionSchema, cleanHashtags, truncateAtSentence } from "../schemas/aiSchemas.js";
import { captionSystemInstruction, buildCaptionPrompt } from "../prompts/captionPrompts.js";
import { captionPlatforms } from "../config/captionPlatforms.js";
import { SeoSchema, SEO_FIELDS, SEO_LIMITS, shortenText, cleanKeywordList } from "../schemas/aiSchemas.js";
import { seoSystemInstruction, buildSeoPrompt } from "../prompts/seoPrompts.js";
import { safeFilename } from "./filenameService.js";

// A problem we understand. The message is safe to show to the user.
export class AiError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// The Gemini client is created the first time we need it
let client;
function getClient() {
  if (!aiConfig.apiKey) {
    throw new AiError("NO_KEY", "The AI assistant isn't set up on the server yet.");
  }
  if (!client) client = new GoogleGenAI({ apiKey: aiConfig.apiKey });
  return client;
}

// Gives up if the promise takes longer than "ms" milliseconds
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AiError("TIMEOUT", "The AI took too long to respond. Please try again.", 504)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Turns any Gemini failure into a friendly AiError.
// The real details go to the server log only, never to the browser.
function translateGeminiError(error) {
  if (error instanceof AiError) return error;
  console.error("Gemini error:", error?.status, error?.message);

  const status = error?.status;
  if (status === 429) {
    return new AiError(
      "RATE_LIMIT",
      "The AI service is busy or its usage limit was reached. Please wait a moment and try again.",
      429
    );
  }
    if (status === 503) {
    return new AiError(
      "AI_BUSY",
      "The AI service is very busy right now. Please try again in a minute.",
      503
    );
  }

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return new AiError(
      "AI_CONFIG",
      "The AI service rejected the request. Please check the server's API key and model settings."
    );
  }
  return new AiError("AI_UNAVAILABLE", "Could not reach the AI service. Please try again.", 502);
}

// Shrinks the photo and converts it to a JPEG, using Sharp (no AI involved).
// This also proves the file is a real image.
async function prepareImage(buffer) {
  try {
    return await sharp(buffer)
      .rotate()
      .resize({
        width: aiConfig.maxImageSide,
        height: aiConfig.maxImageSide,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new AiError("INVALID_IMAGE", "That file doesn't look like a valid JPG or PNG image.", 400);
  }
}

// One call to Gemini that must answer in the given shape (returns the raw text)
async function callGemini({ contents, schema, systemInstruction }) {
  const ai = getClient();

  // Zod schema -> JSON Schema (we drop the "$schema" label, the API doesn't need it)
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema);

  // If Gemini says it is busy (503), wait a moment and try again, up to 2 more times
  const waits = [1500, 3000];
  let response;

  for (let attempt = 0; ; attempt++) {
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: aiConfig.model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
          },
        }),
        aiConfig.timeoutMs
      );
      break; // it worked
    } catch (error) {
      if (error?.status === 503 && attempt < waits.length) {
        console.warn(`Gemini is busy (503). Trying again in ${waits[attempt]} ms...`);
        await new Promise((resolve) => setTimeout(resolve, waits[attempt]));
        continue;
      }
      throw translateGeminiError(error);
    }
  }

  if (response.promptFeedback?.blockReason) {
    throw new AiError("BLOCKED", "The AI couldn't process this image. Try a different photo.", 422);
  }
  return response.text;
}

// Calls Gemini, parses the JSON and checks it against the schema.
// If the answer is unusable we try once more, then give up politely.
async function generateValidated({ contents, schema, systemInstruction }) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const text = await callGemini({ contents, schema, systemInstruction });
    try {
      return schema.parse(JSON.parse(text));
    } catch (error) {
      console.warn(`AI answer failed validation (attempt ${attempt}):`, String(error.message).slice(0, 300));
    }
  }
  throw new AiError("INVALID_RESPONSE", "The AI returned an answer we couldn't use. Please try again.", 502);
}

// What the user typed beats what the AI guessed
function applyUserInfo(analysis, info) {
  return {
    ...analysis,
    brand: info.brand || analysis.brand,
    productName: info.name || analysis.productName,
    userProvided: { brand: Boolean(info.brand), productName: Boolean(info.name) },
  };
}

// The function the controller calls
export async function analyzeImage(imageBuffer, productInfo = {}) {
  const jpeg = await prepareImage(imageBuffer);

  // One image part and one text part, as the Gemini docs show
  const contents = [
    { inlineData: { mimeType: "image/jpeg", data: jpeg.toString("base64") } },
    { text: buildAnalysisPrompt(productInfo) },
  ];

  const raw = await generateValidated({
    contents,
    schema: ProductAnalysisSchema,
    systemInstruction: analysisSystemInstruction,
  });

  return applyUserInfo(normalizeAnalysis(raw), productInfo);
}
// ---------------------------------------------------------------
// Phase 2: text-only features. They reuse the analysis, so no image is sent.
// ---------------------------------------------------------------

// field is "all" or one of: short, ecommerce, oneLine.
// Returns { short: { text, warnings }, ... } for the fields that were asked for.
export async function generateDescription({ analysis, productInfo, tone, field, previous }) {
  const fields = field === "all" ? DESCRIPTION_FIELDS : [field];

  // Ask Gemini only for the fields we need
  const schema = ProductDescriptionSchema.pick(Object.fromEntries(fields.map((f) => [f, true])));
  const facts = buildFacts(analysis, productInfo);

  const raw = await generateValidated({
    contents: buildDescriptionPrompt({ facts, tone, fields, previous }),
    schema,
    systemInstruction: descriptionSystemInstruction,
  });

  // Tidy each text and check it against the facts (plain code, no AI)
  const source = JSON.stringify(facts);
  const items = {};
  for (const name of fields) {
    const text = cleanContentText(raw[name], DESCRIPTION_LIMITS[name]);
    if (!text) {
      throw new AiError("INVALID_RESPONSE", "The AI returned an answer we couldn't use. Please try again.", 502);
    }
    items[name] = { text, warnings: findUnsupportedFacts(text, source) };
  }
  return items;
}

// Returns { text, warnings }
export async function generateAltText({ analysis, previous }) {
  const facts = buildAltFacts(analysis);

  const raw = await generateValidated({
    contents: buildAltTextPrompt({ facts, previous }),
    schema: AltTextSchema,
    systemInstruction: altTextSystemInstruction,
  });

  const text = cleanAltText(raw.altText);
  if (!text) {
    throw new AiError("INVALID_RESPONSE", "The AI returned an answer we couldn't use. Please try again.", 502);
  }
  return { text, warnings: findUnsupportedFacts(text, JSON.stringify(facts)) };
}
// ---------------------------------------------------------------
// Phase 3: social captions
// ---------------------------------------------------------------

// Returns { text, warnings, maxChars }. For Instagram with hashtags, "text" is
// the caption, a blank line, and the hashtags: one ready-to-post text.
export async function generateCaption({ analysis, productInfo, platform, tone, includeHashtags, previous }) {
  const rules = captionPlatforms[platform];
  const withHashtags = includeHashtags && rules.hashtags > 0;

  // Only ask for hashtags when we want them
  const schema = withHashtags ? SocialCaptionSchema : SocialCaptionSchema.pick({ caption: true });
  const facts = buildFacts(analysis, productInfo);

  const raw = await generateValidated({
    contents: buildCaptionPrompt({ facts, platform: rules, tone, withHashtags, previous }),
    schema,
    systemInstruction: captionSystemInstruction,
  });

  // Tidy the caption and keep hashtags in a clean format (plain code, no AI)
  const caption = cleanContentText(raw.caption, 2000);
  if (!caption) {
    throw new AiError("INVALID_RESPONSE", "The AI returned an answer we couldn't use. Please try again.", 502);
  }
  const hashtagLine = withHashtags ? cleanHashtags(raw.hashtags ?? [], rules.hashtags).join(" ") : "";

  // Enforce the platform's length preset
  const room = rules.maxChars - (hashtagLine ? hashtagLine.length + 2 : 0);
  const { text: captionText, shortened } = truncateAtSentence(caption, Math.max(room, 50));
  const text = hashtagLine ? `${captionText}\n\n${hashtagLine}` : captionText;

  // Same safety net as Phase 2: numbers, prices and claims that weren't in the facts
  const warnings = findUnsupportedFacts(text, JSON.stringify(facts));
  if (shortened) {
    warnings.push(`Shortened to fit the ${rules.maxChars}-character preset for ${rules.name}.`);
  }

  return { text, warnings, maxChars: rules.maxChars };
}
// ---------------------------------------------------------------
// Phase 4: SEO metadata
// ---------------------------------------------------------------

// field is "all" or one of: seoTitle, metaDescription, keywords, filenameSuggestion.
// Returns { seoTitle: { text, warnings, maxChars }, ... } for the fields asked for.
export async function generateSeo({ analysis, productInfo, field, previous }) {
  const fields = field === "all" ? SEO_FIELDS : [field];

  // Ask Gemini only for the fields we need
  const schema = SeoSchema.pick(Object.fromEntries(fields.map((f) => [f, true])));
  const facts = buildFacts(analysis, productInfo);

  const raw = await generateValidated({
    contents: buildSeoPrompt({ facts, fields, previous }),
    schema,
    systemInstruction: seoSystemInstruction,
  });

  const source = JSON.stringify(facts);
  const items = {};

  for (const name of fields) {
    let text = "";
    let maxChars;
    const warnings = [];

    if (name === "seoTitle" || name === "metaDescription") {
      // Enforce the length in code, not just in the prompt
      maxChars = SEO_LIMITS[name];
      const cleaned = cleanContentText(raw[name], 400).replace(/\s*\n+\s*/g, " ");
      const { text: fitted, shortened } = shortenText(cleaned, maxChars);
      text = name === "seoTitle" ? fitted.replace(/[.\s]+$/, "") : fitted;
      if (shortened) warnings.push(`Shortened to fit ${maxChars} characters.`);
    } else if (name === "keywords") {
      text = cleanKeywordList(raw.keywords, 8).join(", ");
    } else {
      // The AI only suggests words. Our code builds the final, safe file name.
      text = safeFilename(raw.filenameSuggestion);
      if (text === "product.jpg") {
        warnings.push("The AI's suggestion couldn't be used, so a generic name was used.");
      }
    }

    if (!text) {
      throw new AiError("INVALID_RESPONSE", "The AI returned an answer we couldn't use. Please try again.", 502);
    }

    // Same safety net as the other features (not needed for the file name)
    if (name !== "filenameSuggestion") {
      warnings.push(...findUnsupportedFacts(text, source));
    }

    items[name] = { text, warnings, maxChars };
  }

  return items;
}