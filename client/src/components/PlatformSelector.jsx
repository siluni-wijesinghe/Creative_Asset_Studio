// Shows one card per platform. It doesn't own any state:
// App tells it what's selected, and it tells App when something is clicked.
function PlatformSelector({ presets, selectedIds, onToggle }) {
  return (
    <section className="section">
      <h2>Select output formats</h2>

      <div className="platform-grid">
        {presets.map((preset) => {
          const isSelected = selectedIds.includes(preset.id);

          return (
            // A <label> wraps a hidden checkbox, so clicking anywhere on the
            // card toggles it (and it works with a keyboard too).
            <label
              key={preset.id}
              className={`platform-card ${isSelected ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(preset.id)}
              />

              {/* A small box with the same shape as the output image */}
              <div className="shape-wrap">
                <div
                  className="shape"
                  style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                />
              </div>

              <div className="platform-info">
                <p className="platform-name">{preset.name}</p>
                <p className="platform-meta">
                  {preset.width} × {preset.height}
                </p>
                <p className="platform-meta">
                  {preset.ratio} · {preset.format}
                </p>
              </div>

              <span className="check-mark">{isSelected ? "✓" : ""}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default PlatformSelector;