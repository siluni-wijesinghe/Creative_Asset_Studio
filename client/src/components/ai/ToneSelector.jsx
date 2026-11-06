// These ids match the tones the server accepts
const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "minimal", label: "Minimal" },
  { id: "premium", label: "Premium" },
  { id: "promotional", label: "Promotional" },
];

function ToneSelector({ value, onChange, disabled }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] text-stone-500">Tone</span>
      {TONES.map((tone) => (
        <button
          key={tone.id}
          type="button"
          disabled={disabled}
          className={`cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === tone.id
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
          }`}
          onClick={() => onChange(tone.id)}
        >
          {tone.label}
        </button>
      ))}
    </div>
  );
}

export default ToneSelector;