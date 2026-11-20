import "dotenv/config";
import { generateCaption } from "../services/aiService.js";

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
  for (const platform of ["instagram", "facebook", "linkedin"]) {
    const item = await generateCaption({
      analysis,
      productInfo,
      platform,
      tone: "friendly",
      includeHashtags: platform === "instagram",
    });
    console.log(`\n=== ${platform} (${item.text.length}/${item.maxChars}) ===`);
    console.log(item.text);
    if (item.warnings.length) console.log("WARNINGS:", item.warnings);
  }
} catch (error) {
  console.log("Failed:", error.message);
}