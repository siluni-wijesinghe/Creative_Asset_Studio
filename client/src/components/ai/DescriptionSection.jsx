import { useState } from "react";
import ContentCard from "./ContentCard";
import ToneSelector from "./ToneSelector";
import SecondaryButton from "../SecondaryButton";
import { generateDescription } from "../../utils/aiApi";

// The three texts we write, in display order
const FIELDS = [
  { id: "short", title: "Short description", rows: 3 },
  { id: "ecommerce", title: "Product page description", rows: 7 },
  { id: "oneLine", title: "One-line summary", rows: 2 },
];

function DescriptionSection({ analysis, productInfo }) {
  const [tone, setTone] = useState("professional");
  const [items, setItems] = useState(null); // { short: {text, status, warnings}, ... }
  const [busy, setBusy] = useState("");     // "all", a field id, or "" when idle
  const [error, setError] = useState("");

  // Writes one field, or all of them. Regenerating a field also sends its old
  // text, so the new version is different.
  async function run(field) {
    setBusy(field);
    setError("");

    try {
      const result = await generateDescription({
        analysis,
        productInfo,
        tone,
        field,
        previous: field === "all" ? undefined : items?.[field]?.text,
      });

      // Put the new texts in as drafts. Fields we didn't regenerate stay as they were.
      setItems((current) => {
        const next = { ...(current || {}) };
        for (const [name, value] of Object.entries(result)) {
          next[name] = { text: value.text, warnings: value.warnings, status: "draft" };
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
      <h3 className="mb-1 text-sm font-semibold">Product description</h3>
      <p className="mb-3 text-[13px] text-stone-500">
        Written only from the analysis above and your notes. Review every text before you use it.
      </p>

      <ToneSelector value={tone} onChange={setTone} disabled={busy !== ""} />

      <SecondaryButton className="w-full py-3" onClick={() => run("all")} disabled={busy !== ""}>
        {busy === "all" ? "Writing..." : items ? "Write all again" : "Write description"}
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
                  onChange={(updated) => setItems({ ...items, [field.id]: updated })}
                  onRegenerate={() => run(field.id)}
                  isBusy={busy === field.id}
                  disabled={busy !== ""}
                />
              )
          )}
        </div>
      )}
    </div>
  );
}

export default DescriptionSection;