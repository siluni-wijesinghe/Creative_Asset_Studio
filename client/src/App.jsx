import { useState, useEffect } from "react";
import UploadZone from "./components/UploadZone";
import PlatformSelector from "./components/PlatformSelector";
import GeneratedAssets from "./components/GeneratedAssets";

const API_URL = "http://localhost:5000";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking server...");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [presets, setPresets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [presetsError, setPresetsError] = useState("");

  const [assets, setAssets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // New in Step 9: changing this number rebuilds the upload box from scratch
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setServerStatus(data.message))
      .catch(() => setServerStatus("Server not reachable"));

    fetch(`${API_URL}/api/presets`)
      .then((res) => res.json())
      .then((data) => setPresets(data))
      .catch(() => setPresetsError("Could not load platform options. Is the server running?"));
  }, []);

  function handleFileSelected(newFile) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setAssets([]);
    setGenerateError("");
  }

  function handleToggle(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  // New in Step 9: put everything back to the starting state
  function handleStartOver() {
    if (previewUrl) URL.revokeObjectURL(previewUrl); // free the preview address
    setFile(null);
    setPreviewUrl("");
    setSelectedIds([]);
    setAssets([]);
    setGenerateError("");
    setResetCount((count) => count + 1); // new key = fresh UploadZone
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError("");
    setAssets([]);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("platforms", JSON.stringify(selectedIds));

    try {
      const response = await fetch(`${API_URL}/api/assets/generate`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      // The server sends relative addresses, so add the server address in front
      setAssets(
        data.assets.map((asset) => ({
          ...asset,
          url: API_URL + asset.url,
          downloadUrl: API_URL + asset.downloadUrl,
        }))
      );
    } catch (error) {
      setGenerateError(
        error.message === "Failed to fetch"
          ? "Could not reach the server. Is it running?"
          : error.message
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const canGenerate = file && selectedIds.length > 0 && !isGenerating;

  return (
    <main className="app">
      <header className="header">
        <h1>Creative Asset Studio</h1>
        <p>Turn one product image into platform-ready assets.</p>
      </header>

      <UploadZone
        key={resetCount}
        file={file}
        previewUrl={previewUrl}
        onFileSelected={handleFileSelected}
      />

      {file && presets.length > 0 && (
        <PlatformSelector presets={presets} selectedIds={selectedIds} onToggle={handleToggle} />
      )}

      {presetsError && <p className="error-message">{presetsError}</p>}

      {file && (
        <div className="generate-area">
          <button className="primary-button" onClick={handleGenerate} disabled={!canGenerate}>
            {isGenerating ? "Generating..." : "Generate Assets"}
          </button>
          {selectedIds.length === 0 && (
            <p className="hint">Select at least one platform to continue.</p>
          )}
        </div>
      )}

      {generateError && <p className="error-message">{generateError}</p>}

      {assets.length > 0 && <GeneratedAssets assets={assets} />}

      {/* Only shown once there's something to clear */}
      {file && (
        <button className="text-button" onClick={handleStartOver} disabled={isGenerating}>
          Start Over
        </button>
      )}

      <p className="server-status">{serverStatus}</p>
    </main>
  );
}

export default App;