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
  const inputRef = useRef(null);                // points to the hidden file input
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

  return (
    <div>
      <div
        className={`upload-zone ${isDragging ? "dragging" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            <img className="upload-preview" src={previewUrl} alt="Uploaded product" />
            <p className="file-name">{file.name}</p>
            <p className="file-meta">{formatSize(file.size)} · Click or drop to replace</p>
          </>
        ) : (
          <>
            <p className="upload-title">Drop your product image here</p>
            <p className="file-meta">or click to browse · JPG or PNG, up to {MAX_SIZE_MB} MB</p>
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

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default UploadZone;