// Settings for the AI features. Values come from server/.env.
export const aiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || "gemini-3.5-flash",

  // Images are shrunk before they are sent to Gemini (Phase 1)
  maxImageSide: 1024,

  // Give up on a Gemini call after this many milliseconds
  timeoutMs: 30000,
};