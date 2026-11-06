const API_URL = "http://localhost:5000";

// Sends the photo and the optional product info to the server.
// Returns the analysis, or throws an Error with a message safe to show.
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