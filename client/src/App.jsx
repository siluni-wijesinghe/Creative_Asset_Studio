import { useState, useEffect, useMemo } from "react";
import UploadZone from "./components/UploadZone";
import LogoUpload from "./components/LogoUpload";
import PlatformSelector from "./components/PlatformSelector";
import GeneratedAssets from "./components/GeneratedAssets";
import AiAssistant from "./components/ai/AiAssistant";
import { DEFAULT_LOGO_PLACEMENT } from "./utils/logoPlacement";
import { EMPTY_AI } from "./utils/aiState";
import { buildContentExport } from "./utils/buildContentFile";

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
  const [logoPlacement, setLogoPlacement] = useState(DEFAULT_LOGO_PLACEMENT);

  // New in Phase 6: everything the AI assistant produced (see utils/aiState.js)
  const [ai, setAi] = useState(EMPTY_AI);

  const [assets, setAssets] = useState([]);
  const [zipName, setZipName] = useState(""); // the ZIP's file name, from the server
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

  // If the brand or the naming choices change, results made with the old
  // names are out of date, so clear them.
  useEffect(() => {
    setAssets([]);
  }, [ai.naming, ai.productInfo.brand]);

  function handleFileSelected(newFile) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(newFile);
    setPreviewUrl(URL.createObjectURL(newFile));
    setAssets([]);
    setGenerateError("");
    // A new photo means a new product: clear the AI results, but keep the brand
    setAi((current) => ({
      ...EMPTY_AI,
      productInfo: { ...EMPTY_AI.productInfo, brand: current.productInfo.brand },
    }));
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
    setAi(EMPTY_AI);
    setAssets([]);
    setZipName("");
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
      formData.append("logoPlacement", JSON.stringify(logoPlacement));
    }

    // The naming choices. Without the AI assistant they are mostly empty,
    // and the server falls back to the uploaded file's name.
    const naming = {
      brand: ai.productInfo.brand,
      product: ai.naming?.product ?? "",
      assetType: ai.naming?.assetType ?? (logoFile ? "branded" : "product"),
      version: ai.naming?.version ?? 1,
    };
    formData.append("naming", JSON.stringify(naming));

    try {
      const response = await fetch(`${API_URL}/api/assets/generate`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setZipName(data.zipName || "");
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
    // The approved AI text for the ZIP. It is rebuilt whenever an approval changes,
  // so Download All always uses the current approvals.
  const contentExport = useMemo(
    () => buildContentExport(ai, assets.map((asset) => ({ id: asset.id, name: asset.platform }))),
    [ai, assets]
  );

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

      {file && <AiAssistant file={file} ai={ai} setAi={setAi} platforms={selectedIds} />}

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

      {assets.length > 0 && (
        <GeneratedAssets assets={assets} zipName={zipName} contentExport={contentExport} />
      )}

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