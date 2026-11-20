// Everything the AI assistant produces. It lives in App, so the export
// step can use it too.
export const EMPTY_AI = {
  productInfo: { brand: "", name: "", notes: "" },
  analysis: null,
  naming: null,       // { product, assetType, version }
  description: null,  // { short, ecommerce, oneLine }, each { text, status, warnings }
  altText: null,      // { text, status, warnings }
  captions: {},       // one entry per platform
  seo: null,          // { seoTitle, metaDescription, keywords, filenameSuggestion }
};

// The first naming choices after an analysis: your own product name,
// or else the AI's name for the product
export function defaultNaming(analysis, productInfo) {
  const aiName = analysis.productName.toLowerCase() === "unknown" ? "" : analysis.productName;
  return { product: productInfo.name || aiName, assetType: "product", version: 1 };
}