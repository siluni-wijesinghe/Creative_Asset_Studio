import "dotenv/config";
import { generateDescription, generateAltText } from "../services/aiService.js";

// A sample analysis, shaped like the one the server returns
const analysis = {
  isProduct: true,
  productName: "ceramic coffee mug",
  category: "Home & Kitchen",
  visibleCharacteristics: ["blue geometric pattern", "curved handle"],
  colors: ["white", "blue"],
  material: "unknown",
  brand: "unknown",
  visibleText: [],
  summary: "A white mug with a blue geometric pattern and a curved handle.",
  keywords: [],
  tags: [],
  confidence: 0.8,
  uncertainties: [],
  userProvided: { brand: false, productName: false },
};
const productInfo = { brand: "", name: "", notes: "" };

try {
  const items = await generateDescription({ analysis, productInfo, tone: "friendly", field: "all" });
  console.log(JSON.stringify(items, null, 2));

  const alt = await generateAltText({ analysis });
  console.log(JSON.stringify(alt, null, 2));
} catch (error) {
  console.log("Failed:", error.message);
}