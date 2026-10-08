import { useRef, useState } from "react";

// Settings for what we accept. Easy to change later.
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_SIZE_MB = 10;

// Turn bytes into something readable, like "2.4 MB"
function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function UploadZone({ file, previewUrl, onFileSelected }) {
  const inputRef = useRef(null); // points to the hidden file input
  const [isDragging, setIsDragging] = useState(false); // highlight while dragging
  const [error, setError] = useState("");

  // One function checks every file, whether it was dropped or browsed.
  function handleFile(newFile) {
    if (!newFile) return;

    if (!ALLOWED_TYPES.includes(newFile.type)) {
      setError("Unsupported file. Please upload a JPG or PNG image.");
      return;
    }
    if (newFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That file is too large. The limit is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setError("");
    onFileSelected(newFile); // pass the valid file up to App
  }

  function handleDrop(event) {
    event.preventDefault(); // stop the browser from opening the file
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function handleInputChange(event) {
    handleFile(event.target.files[0]);
    event.target.value = ""; // lets you pick the same file again later
  }

  // The look of the box changes while a file is being dragged over it.
  // We build the class list as text and pick one of two sets.
  const zoneColors = isDragging
    ? "border-stone-900 bg-stone-100"
    : "border-stone-300 bg-white hover:border-stone-400";

  return (
    <div>
      <div
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${zoneColors}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            <img
              className="mx-auto mb-4 max-h-80 max-w-full rounded-xl"
              src={previewUrl}
              alt="Uploaded product"
            />
            <p className="mb-1 break-all font-semibold">{file.name}</p>
            <p className="text-sm text-stone-500">
              {formatSize(file.size)} · Click or drop to replace
            </p>
          </>
        ) : (
          <>
            <p className="mb-2 text-lg font-semibold">Drop your product image here</p>
            <p className="text-sm text-stone-500">
              or click to browse · JPG or PNG, up to {MAX_SIZE_MB} MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleInputChange}
          hidden
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

export default UploadZone;