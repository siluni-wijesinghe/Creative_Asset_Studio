import { useState } from "react";
import SecondaryButton from "../SecondaryButton";

const STATUS_LABELS = { draft: "Draft", edited: "Edited", approved: "Approved" };
const STATUS_STYLES = {
  draft: "bg-stone-100 text-stone-600",
  edited: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
};

// One piece of AI-written text with Edit, Regenerate, Copy and Approve.
// The parent owns the data; this card shows it and reports what the user does.
//   item = { text, status: "draft" | "edited" | "approved", warnings: [] }
function ContentCard({ title, item, onChange, onRegenerate, isBusy, disabled, rows = 3 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Typing in the box: the text changed, so any approval is cancelled
  function handleEdit(event) {
    onChange({ ...item, text: event.target.value, status: "edited", warnings: [] });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Copying can fail on some browsers. The text can still be selected by hand.
    }
  }

  // Approve or un-approve
  function handleApprove() {
    onChange({ ...item, status: item.status === "approved" ? "draft" : "approved" });
  }

  const isApproved = item.status === "approved";
  const buttonSize = "px-3 py-1.5 text-[13px]";

  return (
    <div className="rounded-xl border-[1.5px] border-stone-200 bg-stone-50 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-stone-700">{title}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLES[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      {isEditing ? (
        <textarea
          className="w-full rounded-[10px] border-[1.5px] border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900"
          rows={rows}
          value={item.text}
          onChange={handleEdit}
        />
      ) : (
        <p className="whitespace-pre-line text-sm">{item.text}</p>
      )}

      {item.warnings.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="mb-1 font-semibold">Check before approving</p>
          <ul className="list-disc pl-4">
            {item.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton
          className={buttonSize}
          onClick={() => setIsEditing(!isEditing)}
          disabled={disabled}
        >
          {isEditing ? "Done" : "Edit"}
        </SecondaryButton>

        <SecondaryButton
          className={buttonSize}
          onClick={onRegenerate}
          disabled={disabled || isEditing}
        >
          {isBusy ? "Regenerating..." : "Regenerate"}
        </SecondaryButton>

        <SecondaryButton className={buttonSize} onClick={handleCopy} disabled={isEditing}>
          {copied ? "Copied" : "Copy"}
        </SecondaryButton>

        {/* Approve is a plain button so it can have its own colors */}
        <button
          type="button"
          className={`cursor-pointer rounded-[10px] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            isApproved
              ? "bg-emerald-600 hover:enabled:bg-emerald-700"
              : "bg-stone-900 hover:enabled:bg-stone-700"
          }`}
          onClick={handleApprove}
          disabled={disabled || isEditing}
        >
          {isApproved ? "✓ Approved" : "Approve"}
        </button>
      </div>
    </div>
  );
}

export default ContentCard;