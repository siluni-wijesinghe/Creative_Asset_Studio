const API_URL = "http://localhost:5000";

// Sends JSON to the server. Returns the answer, or throws an Error
// with a message that is safe to show.
async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Is it running?");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The AI request failed. Please try again.");
  }
  return data;
}

// Sends the photo and the optional product info. Returns the analysis.
export async function analyzeProduct(imageFile, productInfo) {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("productInfo", JSON.stringify(productInfo));

  let response;
  try {
    response = await fetch(`${API_URL}/api/ai/analyze`, { method: "POST", body: formData });
  } catch {
    throw new Error("Could not reach the server. Is it running?");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "The AI analysis failed. Please try again.");
  }
  return data.analysis;
}

// field: "all", "short", "ecommerce" or "oneLine".
// Returns { short: { text, warnings }, ... } for the fields that were written.
export async function generateDescription({ analysis, productInfo, tone, field, previous }) {
  const data = await postJson("/api/ai/description", { analysis, productInfo, tone, field, previous });
  return data.items;
}

// Returns { text, warnings }
export async function generateAltText({ analysis, previous }) {
  const data = await postJson("/api/ai/alt-text", { analysis, previous });
  return data.item;
}
// platform: "instagram", "facebook" or "linkedin".
// Returns { text, warnings, maxChars }.
export async function generateCaption({ analysis, productInfo, platform, tone, includeHashtags, previous }) {
  const data = await postJson("/api/ai/caption", {
    analysis,
    productInfo,
    platform,
    tone,
    includeHashtags,
    previous,
  });
  return data.item;
}
// field: "all", "seoTitle", "metaDescription", "keywords" or "filenameSuggestion".
// Returns { seoTitle: { text, warnings, maxChars }, ... } for the fields written.
export async function generateSeo({ analysis, productInfo, field, previous }) {
  const data = await postJson("/api/ai/seo", { analysis, productInfo, field, previous });
  return data.items;
}