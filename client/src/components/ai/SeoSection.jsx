import { useState } from "react";
import ContentCard from "./ContentCard";
import SecondaryButton from "../SecondaryButton";
import { generateSeo } from "../../utils/aiApi";

// The four texts we write, in display order
const FIELDS = [
  { id: "seoTitle", title: "SEO title", rows: 2 },
  { id: "metaDescription", title: "Meta description", rows: 3 },
  { id: "keywords", title: "Keywords", rows: 2 },
  { id: "filenameSuggestion", title: "Image file name suggestion", rows: 1 },
];

function SeoSection({ analysis, productInfo }) {
  const [items, setItems] = useState(null); // { seoTitle: {text, status, warnings, maxChars}, ... }
  const [busy, setBusy] = useState("");     // "all", a field id, or "" when idle
  const [error, setError] = useState("");

  // Writes one field, or all of them. Regenerating sends the old text too.
  async function run(field) {
    setBusy(field);
    setError("");

    try {
      const result = await generateSeo({
        analysis,
        productInfo,
        field,
        previous: field === "all" ? undefined : items?.[field]?.text,
      });

      // New texts come in as drafts. Fields we didn't regenerate stay as they were.
      setItems((current) => {
        const next = { ...(current || {}) };
        for (const [name, value] of Object.entries(result)) {
          next[name] = { ...value, status: "draft" };
        }
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">SEO metadata</h3>
      <p className="mb-3 text-[13px] text-stone-500">
        For a product page or listing. Written only from the analysis and your notes. Review every
        text before you use it.
      </p>

      <SecondaryButton className="w-full py-3" onClick={() => run("all")} disabled={busy !== ""}>
        {busy === "all" ? "Writing..." : items ? "Write all again" : "Write SEO metadata"}
      </SecondaryButton>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {items && (
        <div className="mt-4 space-y-3">
          {FIELDS.map(
            (field) =>
              items[field.id] && (
                <ContentCard
                  key={field.id}
                  title={field.title}
                  rows={field.rows}
                  item={items[field.id]}
                  maxChars={items[field.id].maxChars}
                  onChange={(updated) => setItems({ ...items, [field.id]: updated })}
                  onRegenerate={() => run(field.id)}
                  isBusy={busy === field.id}
                  disabled={busy !== ""}
                />
              )
          )}
          <p className="text-xs text-stone-400">
            The file name is only a suggestion. It isn't used for exports yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default SeoSection;