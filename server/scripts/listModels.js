import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Prints every model this key can call, with what it supports
const pager = await ai.models.list();
for await (const model of pager) {
  if (String(model.name).includes("gemini")) {
    console.log(model.name, "|", model.supportedActions ?? "");
  }
}