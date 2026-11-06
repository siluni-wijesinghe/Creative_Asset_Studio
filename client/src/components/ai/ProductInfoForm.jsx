// Shared look for all the inputs
const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-stone-900 disabled:opacity-50";

// Three optional fields. App-level data stays in the parent; we just report changes.
function ProductInfoForm({ value, onChange, disabled }) {
  // Copies the current values and changes just one field
  function update(field, text) {
    onChange({ ...value, [field]: text });
  }

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-[13px] text-stone-500">Brand (optional)</span>
        <input
          className={inputClass}
          value={value.brand}
          maxLength={60}
          disabled={disabled}
          placeholder="e.g. Acme"
          onChange={(e) => update("brand", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[13px] text-stone-500">Product name (optional)</span>
        <input
          className={inputClass}
          value={value.name}
          maxLength={100}
          disabled={disabled}
          placeholder="e.g. Blue coffee mug"
          onChange={(e) => update("name", e.target.value)}
        />
      </label>

      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[13px] text-stone-500">
          Notes (optional): things the photo can't show, like size or material
        </span>
        <textarea
          className={inputClass}
          rows={2}
          value={value.notes}
          maxLength={500}
          disabled={disabled}
          placeholder="e.g. Holds 350 ml, dishwasher safe"
          onChange={(e) => update("notes", e.target.value)}
        />
      </label>
    </div>
  );
}

export default ProductInfoForm;
// ---------------------------------------------------------------
// Phase 2: descriptions and alt text
// ---------------------------------------------------------------

// The tones the user can choose. The server is the source of truth.
export const TONES = ["professional", "friendly", "minimal", "premium", "promotional"];

export const DESCRIPTION_FIELDS = ["short", "ecommerce", "oneLine"];

// Longest allowed text for each field (we shorten anything longer)
export const DESCRIPTION_LIMITS = { short: 300, ecommerce: 1200, oneLine: 120 };

// The shape we ask Gemini to answer in
export const ProductDescriptionSchema = z.object({
  short: z.string().describe("1-2 sentences, up to 40 words"),
  ecommerce: z
    .string()
    .describe("A product page description of 60-110 words in 1-2 short paragraphs"),
  oneLine: z.string().describe("A single-line summary of at most 100 characters"),
});

export const AltTextSchema = z.object({
  altText: z.string().describe("One concise sentence describing only what is visible"),
});

// The analysis comes back from the browser, so we check it again.
// It mirrors what normalizeAnalysis() produces, with size limits.
const text = (max) => z.string().max(max);
export const AnalysisInputSchema = z.object({
  isProduct: z.boolean(),
  productName: text(100),
  category: text(60),
  visibleCharacteristics: z.array(text(100)).max(8),
  colors: z.array(text(30)).max(6),
  material: text(60),
  brand: text(60),
  visibleText: z.array(text(80)).max(6),
  summary: text(300),
  keywords: z.array(text(40)).max(10),
  tags: z.array(text(41)).max(8),
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(text(120)).max(5),
  userProvided: z.object({ brand: z.boolean(), productName: z.boolean() }),
});

// What the browser may send to each endpoint
export const DescriptionRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  productInfo: ProductInfoSchema.default({ brand: "", name: "", notes: "" }),
  tone: z.enum(TONES),
  field: z.enum(["all", ...DESCRIPTION_FIELDS]).default("all"),
  previous: z.string().max(1500).optional(), // the old text, so Regenerate can differ
});

export const AltTextRequestSchema = z.object({
  analysis: AnalysisInputSchema,
  previous: z.string().max(500).optional(),
});

// ---- Tidy-up for the generated texts ----

// Removes markdown symbols and extra spaces, then shortens
export function cleanContentText(value, maxLength) {
  return String(value ?? "")
    .replace(/[*#`_]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

// Alt text rules: no "Image of" opener, starts with a capital, ends with a period
export function cleanAltText(value) {
  let altText = String(value ?? "").replace(/\s+/g, " ").trim();
  altText = altText.replace(
    /^(?:an?\s+)?(?:image|photo|picture|photograph)\s+of\s+(?:an?\s+|the\s+)?/i,
    ""
  );
  altText = altText.slice(0, 150);
  if (!altText) return "";
  altText = altText.charAt(0).toUpperCase() + altText.slice(1);
  return /[.!?]$/.test(altText) ? altText : altText + ".";
}