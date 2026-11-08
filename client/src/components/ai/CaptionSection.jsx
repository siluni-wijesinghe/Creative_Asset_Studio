import { useState } from "react";
import ContentCard from "./ContentCard";
import ToneSelector from "./ToneSelector";
import SecondaryButton from "../SecondaryButton";
import { generateCaption } from "../../utils/aiApi";

// The ids match the platforms the server knows
const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

// The four caption tones from the plan
const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "promotional", label: "Promotional" },
  { id: "minimal", label: "Minimal" },
];

function CaptionSection({ analysis, productInfo }) {
  const [platform, setPlatform] = useState("instagram"); // the tab we're looking at
  const [tone, setTone] = useState("friendly");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [items, setItems] = useState({}); // one result per platform
  const [busy, setBusy] = useState("");   // the platform being written, or ""
  const [error, setError] = useState("");

  const item = items[platform];
  const platformLabel = PLATFORMS.find((p) => p.id === platform).label;

  // Writes (or rewrites) the caption for the current platform
  async function run() {
    const target = platform; // remember it, in case the tab changes meanwhile
    setBusy(target);
    setError("");

    try {
      const result = await generateCaption({
        analysis,
        productInfo,
        platform: target,
        tone,
        includeHashtags: target === "instagram" && includeHashtags,
        previous: items[target]?.text, // Regenerate sends the old text
      });
      setItems((current) => ({ ...current, [target]: { ...result, status: "draft" } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">Social captions</h3>
      <p className="mb-3 text-[13px] text-stone-500">
        Each platform gets its own caption. Review every text before you post it.
      </p>

      {/* Platform tabs */}
      <div className="mb-3 flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy !== ""}
            className={`cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              platform === p.id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => {
              setPlatform(p.id);
              setError("");
            }}
          >
            {p.label}
            {/* A dot shows which platforms already have a caption */}
            {items[p.id] && " •"}
          </button>
        ))}
      </div>

      <ToneSelector value={tone} onChange={setTone} disabled={busy !== ""} tones={TONES} />

      {/* Hashtags are only offered for Instagram */}
      {platform === "instagram" && (
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="size-4 accent-stone-900"
            checked={includeHashtags}
            disabled={busy !== ""}
            onChange={(e) => setIncludeHashtags(e.target.checked)}
          />
          Include hashtags
        </label>
      )}

      {!item && (
        <SecondaryButton className="w-full py-3" onClick={run} disabled={busy !== ""}>
          {busy === platform ? "Writing..." : `Write ${platformLabel} caption`}
        </SecondaryButton>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {item && (
        <ContentCard
          title={`${platformLabel} caption`}
          rows={6}
          item={item}
          maxChars={item.maxChars}
          onChange={(updated) => setItems({ ...items, [platform]: updated })}
          onRegenerate={run}
          isBusy={busy === platform}
          disabled={busy !== ""}
        />
      )}
    </div>
  );
}

export default CaptionSection;