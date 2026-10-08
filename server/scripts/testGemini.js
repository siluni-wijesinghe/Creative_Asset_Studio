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

try {
  const response = await ai.models.generateContent({
    model: aiConfig.model,
    contents: "Reply with the single word: ready",
  });
  console.log("Gemini says:", response.text);
} catch (error) {
  // error.message can be long, but it never contains the key
  console.log("The call failed:", error.message);
}