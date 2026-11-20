// Everything the AI can write. "get" reads one item from the ai object
// (see utils/aiState.js). An item looks like { text, status, warnings }.
const ITEMS = [
  { id: "altText", label: "Alt text", get: (ai) => ai.altText },
  { id: "instagramCaption", label: "Instagram caption", get: (ai) => ai.captions?.instagram },
  { id: "facebookCaption", label: "Facebook caption", get: (ai) => ai.captions?.facebook },
  { id: "linkedinCaption", label: "LinkedIn caption", get: (ai) => ai.captions?.linkedin },
  { id: "seoTitle", label: "SEO title", get: (ai) => ai.seo?.seoTitle },
  { id: "metaDescription", label: "Meta description", get: (ai) => ai.seo?.metaDescription },
  { id: "keywords", label: "Keywords", get: (ai) => ai.seo?.keywords },
  { id: "short", label: "Short description", get: (ai) => ai.description?.short },
  { id: "ecommerce", label: "Product page description", get: (ai) => ai.description?.ecommerce },
  { id: "oneLine", label: "One-line summary", get: (ai) => ai.description?.oneLine },
];

// Which texts belong to which platform, and what each is called there.
// This is application code, not AI: change it here and the export follows.
// Each entry is [item id, heading in the file].
const PLATFORM_ITEMS = {
  instagram: [["instagramCaption", "Caption"]],
  facebook: [["facebookCaption", "Caption"]],
  website: [
    ["seoTitle", "SEO title"],
    ["metaDescription", "Meta description"],
    ["ecommerce", "Product page description"],
    ["short", "Short description"],
  ],
  marketplace: [
    ["seoTitle", "Product title"],
    ["short", "Short description"],
    ["keywords", "Keywords"],
  ],
};

// Builds the content of approved-content.txt. Only approved texts go in.
//   ai        = everything the AI produced
//   platforms = the platforms that were exported: [{ id, name }]
// Returns { text, generatedCount, approvedCount, leftOut }
//   text is null when nothing is approved
//   leftOut lists the texts that exist but are NOT approved
export function buildContentExport(ai, platforms) {
  const generated = ITEMS.filter((item) => item.get(ai)?.text);
  const approved = generated.filter((item) => item.get(ai).status === "approved");
  const leftOut = generated
    .filter((item) => item.get(ai).status !== "approved")
    .map((item) => item.label);

  const result = {
    text: null,
    generatedCount: generated.length,
    approvedCount: approved.length,
    leftOut,
  };
  if (approved.length === 0) return result;

  const approvedIds = new Set(approved.map((item) => item.id));
  const textOf = (id) => ITEMS.find((item) => item.id === id).get(ai).text;

  // One section per exported platform, with only its approved texts
  const printed = new Set();
  const sections = [];
  for (const platform of platforms) {
    const entries = [...(PLATFORM_ITEMS[platform.id] ?? []), ["altText", "Alt text"]];
    const blocks = [];
    for (const [id, heading] of entries) {
      if (!approvedIds.has(id)) continue;
      printed.add(id);
      blocks.push(`${heading}:\n${textOf(id)}`);
    }
    if (blocks.length > 0) {
      sections.push(`=== ${platform.name} ===\n\n${blocks.join("\n\n")}`);
    }
  }

  // Approved texts that no exported platform used
  const others = approved.filter((item) => !printed.has(item.id));
  if (others.length > 0) {
    const blocks = others.map((item) => `${item.label}:\n${textOf(item.id)}`);
    sections.push(`=== Other approved text ===\n\n${blocks.join("\n\n")}`);
  }

  // A short header that says what this file is
  const header = ["Creative Asset Studio: approved content"];
  const product = ai.naming?.product || ai.productInfo.name;
  if (product) header.push(`Product: ${product}`);
  if (ai.productInfo.brand) header.push(`Brand: ${ai.productInfo.brand}`);
  if (ai.naming?.version) header.push(`Version: v${ai.naming.version}`);
  header.push("Only text you approved is included. Check it once more before you publish.");

  result.text = [header.join("\n"), ...sections].join("\n\n") + "\n";
  return result;
}