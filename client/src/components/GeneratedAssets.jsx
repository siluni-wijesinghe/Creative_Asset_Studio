import { useState } from "react";
import AssetCard from "./AssetCard";
import { downloadAllAsZip } from "../utils/downloadZip";

// The results section: a title, a Download All button, and one card per asset.
function GeneratedAssets({ assets }) {
  const [isZipping, setIsZipping] = useState(false); // true while the ZIP is being built
  const [zipError, setZipError] = useState("");

  async function handleDownloadAll() {
    setIsZipping(true);
    setZipError("");

    try {
      await downloadAllAsZip(assets, "creative-assets.zip");
    } catch (error) {
      setZipError("Could not create the ZIP file. Please try again.");
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <section className="section">
      <div className="results-header">
        <h2>Generated Assets</h2>
        <button
          className="secondary-button"
          onClick={handleDownloadAll}
          disabled={isZipping}
        >
          {isZipping ? "Preparing ZIP..." : "Download All"}
        </button>
      </div>

      {zipError && <p className="error-message">{zipError}</p>}

      <div className="asset-grid">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}

export default GeneratedAssets;