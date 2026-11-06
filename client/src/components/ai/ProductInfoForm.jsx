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