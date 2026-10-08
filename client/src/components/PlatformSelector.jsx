// Shows one card per platform. It doesn't own any state:
// App tells it what's selected, and it tells App when something is clicked.
function PlatformSelector({ presets, selectedIds, onToggle }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-base font-semibold">Select output formats</h2>

      {/* 1 column on small screens, 2 columns from the "sm" breakpoint up */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {presets.map((preset) => {
          const isSelected = selectedIds.includes(preset.id);

          // Two looks for the card: selected (dark ring) or not (light border)
          const cardColors = isSelected
            ? "border-stone-900 ring-1 ring-stone-900"
            : "border-stone-200 hover:border-stone-400";

          return (
            // A <label> wraps a hidden checkbox, so clicking anywhere on the
            // card toggles it (and it works with a keyboard too).
            <label
              key={preset.id}
              className={`relative flex cursor-pointer flex-col gap-4 rounded-2xl border-[1.5px] bg-white p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-stone-900 ${cardColors}`}
            >
              {/* "sr-only" hides the checkbox visually but keeps it usable */}
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                onChange={() => onToggle(preset.id)}
              />

              {/* A small box with the same shape as the output image */}
              <div className="flex h-16 items-center justify-center">
                <div
                  className={`h-full max-h-full max-w-full rounded-sm ${
                    isSelected ? "bg-stone-900" : "bg-stone-200"
                  }`}
                  style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                />
              </div>

              <div>
                <p className="mb-1 font-semibold">{preset.name}</p>
                <p className="text-[13px] text-stone-500">
                  {preset.width} × {preset.height}
                </p>
                <p className="text-[13px] text-stone-500">
                  {preset.ratio} · {preset.format}
                </p>
              </div>

              <span className="absolute right-3 top-2.5 text-sm font-bold">
                {isSelected ? "✓" : ""}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default PlatformSelector;