import { useRef, useState } from "react";
import LogoEditor from "./LogoEditor";

// Logos are usually PNG (they can be transparent), but JPG is fine too.
const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_MB = 5;

// Shows the optional "Brand" section. App owns the data;
// this component only displays it and reports what the user does.
function LogoUpload({
  logoFile,
  logoPreviewUrl,
  productPreviewUrl,
  presets,
  logoPlacement,
  onLogoSelected,
  onLogoRemoved,
  onPlacementChange,
}) {
  const inputRef = useRef(null); // points to the hidden file input
  const [error, setError] = useState("");

  function handleChange(event) {
    const newFile = event.target.files[0];
    event.target.value = ""; // lets you choose the same file again later
    if (!newFile) return;

    if (!ALLOWED_TYPES.includes(newFile.type)) {
      setError("Unsupported file. Please upload a PNG or JPG logo.");
      return;
    }
    if (newFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That file is too large. The limit is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setError("");
    onLogoSelected(newFile);
  }

  return (
    <section className="section">
      <h2>
        Brand <span className="optional">(optional)</span>
      </h2>

      <div className="logo-row">
        {logoPreviewUrl ? (
          <>
            <div className="logo-thumb">
              <img src={logoPreviewUrl} alt="Logo preview" />
            </div>
            <div className="logo-info">
              <p className="file-name">{logoFile.name}</p>
              <p className="file-meta">Logo added</p>
            </div>
            <button className="secondary-button" onClick={onLogoRemoved}>
              Remove
            </button>
          </>
        ) : (
          <>
            <p className="file-meta logo-hint">
              Add your logo to place it on every asset. PNG or JPG, up to {MAX_SIZE_MB} MB.
            </p>
            <button className="secondary-button" onClick={() => inputRef.current.click()}>
              Upload logo
            </button>
          </>
        )}

        {/* Always present, so the Upload button can open it */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleChange}
          hidden
        />
      </div>

      {error && <p className="error-message">{error}</p>}

      {/* The editor only makes sense with a logo (and the platform list loaded) */}
      {logoPreviewUrl && presets.length > 0 && (
        <LogoEditor
          productUrl={productPreviewUrl}
          logoUrl={logoPreviewUrl}
          presets={presets}
          placement={logoPlacement}
          onChange={onPlacementChange}
        />
      )}
    </section>
  );
}

export default LogoUpload;