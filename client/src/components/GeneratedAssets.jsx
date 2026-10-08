import { useState } from "react";
import AssetCard from "./AssetCard";
import SecondaryButton from "./SecondaryButton";
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
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Generated Assets</h2>
        <SecondaryButton onClick={handleDownloadAll} disabled={isZipping}>
          {isZipping ? "Preparing ZIP..." : "Download All"}
        </SecondaryButton>
      </div>

      {zipError && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{zipError}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}

export default GeneratedAssets;