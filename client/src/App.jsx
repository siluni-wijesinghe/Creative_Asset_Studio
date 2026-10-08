import { useState, useEffect } from "react";
import UploadZone from "./components/UploadZone";
import LogoUpload from "./components/LogoUpload";
import PlatformSelector from "./components/PlatformSelector";
import GeneratedAssets from "./components/GeneratedAssets";
import { DEFAULT_LOGO_PLACEMENT } from "./utils/logoPlacement";

const API_URL = "http://localhost:5000";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking server...");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [presets, setPresets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [presetsError, setPresetsError] = useState("");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  // New in Step 14: one object replaces logoPosition and logoSize
  const [logoPlacement, setLogoPlacement] = useState(DEFAULT_LOGO_PLACEMENT);

  const [assets, setAssets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
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

  function handleLogoSelected(newLogo) {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(newLogo);
    setLogoPreviewUrl(URL.createObjectURL(newLogo));
    setAssets([]); // old results were made without this logo
  }

  function handleLogoRemoved() {
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setLogoFile(null);
    setLogoPreviewUrl("");
    setLogoPlacement(DEFAULT_LOGO_PLACEMENT);
    setAssets([]);
  }

  // Called while the logo is dragged or resized
  function handlePlacementChange(newPlacement) {
    setLogoPlacement(newPlacement);
    setAssets([]); // old results used the old placement
  }

  function handleToggle(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function handleStartOver() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    setFile(null);
    setPreviewUrl("");
    setLogoFile(null);
    setLogoPreviewUrl("");
    setLogoPlacement(DEFAULT_LOGO_PLACEMENT);
    setSelectedIds([]);
    setAssets([]);
    setGenerateError("");
    setResetCount((count) => count + 1);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError("");
    setAssets([]);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("platforms", JSON.stringify(selectedIds));
    if (logoFile) {
      formData.append("logo", logoFile);
      // New in Step 14: send the placement as text, like '{"x":0.78,"y":0.78,"width":0.18}'
      formData.append("logoPlacement", JSON.stringify(logoPlacement));
    }

    try {
      const response = await fetch(`${API_URL}/api/assets/generate`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

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
        <main className="mx-auto max-w-[640px] px-6 py-16">
      <header>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Creative Asset Studio</h1>
        <p className="mb-10 text-stone-500">Turn one product image into platform-ready assets.</p>
      </header>

      <UploadZone
        key={resetCount}
        file={file}
        previewUrl={previewUrl}
        onFileSelected={handleFileSelected}
      />

      {file && (
        <LogoUpload
          logoFile={logoFile}
          logoPreviewUrl={logoPreviewUrl}
          productPreviewUrl={previewUrl}
          presets={presets}
          logoPlacement={logoPlacement}
          onLogoSelected={handleLogoSelected}
          onLogoRemoved={handleLogoRemoved}
          onPlacementChange={handlePlacementChange}
        />
      )}

      {file && presets.length > 0 && (
        <PlatformSelector presets={presets} selectedIds={selectedIds} onToggle={handleToggle} />
      )}

            {presetsError && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{presetsError}</p>
      )}

      {file && (
        <div className="mt-8">
          <button
            className="w-full cursor-pointer rounded-xl bg-stone-900 py-4 text-base font-semibold text-white transition-colors hover:enabled:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-35"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            {isGenerating ? "Generating..." : "Generate Assets"}
          </button>
          {selectedIds.length === 0 && (
            <p className="mt-2.5 text-center text-[13px] text-stone-400">
              Select at least one platform to continue.
            </p>
          )}
        </div>
      )}

      {generateError && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{generateError}</p>
      )}

      {assets.length > 0 && <GeneratedAssets assets={assets} />}

      {file && (
        <button
          className="mx-auto mt-10 block cursor-pointer rounded-lg px-4 py-2 text-sm text-stone-500 transition-colors hover:enabled:bg-stone-100 hover:enabled:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={handleStartOver}
          disabled={isGenerating}
        >
          Start Over
        </button>
      )}

            <p className="mt-12 text-center text-xs text-stone-400">{serverStatus}</p>
    </main>
  );
}

export default App;