import { useState } from "react";
import ContentCard from "./ContentCard";
import SecondaryButton from "../SecondaryButton";
import { generateAltText } from "../../utils/aiApi";

function AltTextSection({ analysis }) {
  const [item, setItem] = useState(null); // { text, status, warnings }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");

    try {
      const result = await generateAltText({ analysis, previous: item?.text });
      setItem({ text: result.text, warnings: result.warnings, status: "draft" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">Alt text</h3>
      <p className="mb-3 text-[13px] text-stone-500">
        A short description of what the photo shows, for screen readers and search engines.
      </p>

      {!item && (
        <SecondaryButton className="w-full py-3" onClick={run} disabled={busy}>
          {busy ? "Writing..." : "Write alt text"}
        </SecondaryButton>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {item && (
        <ContentCard
          title="Alt text"
          rows={2}
          item={item}
          onChange={setItem}
          onRegenerate={run}
          isBusy={busy}
          disabled={busy}
        />
      )}
    </div>
  );
}

export default AltTextSection;