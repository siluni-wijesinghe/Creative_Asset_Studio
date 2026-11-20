import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { aiConfig } from "../config/ai.js";

// Never print the key itself, only whether it was found
console.log("Key loaded:", aiConfig.apiKey ? "yes" : "NO");
console.log("Model:", aiConfig.model);

if (!aiConfig.apiKey) {
  console.log("Add GEMINI_API_KEY to server/.env and try again.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: aiConfig.apiKey });
const start = Date.now();

try {
  const response = await ai.models.generateContent({
    model: aiConfig.model,
    contents: "Reply with the single word: ready",
  });
  console.log("Gemini says:", response.text);
} catch (error) {
  console.log("The call failed:", error.message);
}

console.log(`Took ${((Date.now() - start) / 1000).toFixed(1)} seconds`);