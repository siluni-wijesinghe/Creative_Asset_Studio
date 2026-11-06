import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { z } from "zod";
import { aiConfig } from "../config/ai.js";
import { ProductAnalysisSchema, normalizeAnalysis } from "../schemas/aiSchemas.js";
import { analysisSystemInstruction, buildAnalysisPrompt } from "../prompts/analysisPrompt.js";

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

  let response;
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
  } catch (error) {
    throw translateGeminiError(error);
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