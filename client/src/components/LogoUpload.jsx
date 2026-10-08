import { useRef, useState } from "react";
import LogoEditor from "./LogoEditor";
import SecondaryButton from "./SecondaryButton";

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
    <section className="mt-10">
      <h2 className="mb-4 text-base font-semibold">
        Brand{" "}
        <span className="text-[13px] font-normal text-stone-400">(optional)</span>
      </h2>

      <div className="flex items-center gap-4 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
        {logoPreviewUrl ? (
          <>
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-stone-100">
              <img className="max-h-full max-w-full" src={logoPreviewUrl} alt="Logo preview" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 break-all text-sm font-semibold">{logoFile.name}</p>
              <p className="text-sm text-stone-500">Logo added</p>
            </div>
            <SecondaryButton onClick={onLogoRemoved}>Remove</SecondaryButton>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-stone-500">
              Add your logo to place it on every asset. PNG or JPG, up to {MAX_SIZE_MB} MB.
            </p>
            <SecondaryButton onClick={() => inputRef.current.click()}>
              Upload logo
            </SecondaryButton>
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

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

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