import { useState } from "react";
import AssetCard from "./AssetCard";
import SecondaryButton from "./SecondaryButton";
import { downloadAllAsZip } from "../utils/downloadZip";

// The results section: a title, a Download All button, a note about the
// AI text, and one card per asset.
//   contentExport = what buildContentExport() made from the approved AI text
function GeneratedAssets({ assets, zipName, contentExport }) {
  const [isZipping, setIsZipping] = useState(false); // true while the ZIP is being built
  const [zipError, setZipError] = useState("");

  async function handleDownloadAll() {
    setIsZipping(true);
    setZipError("");

    // Only approved text goes into the ZIP, as a text file
    const extraFiles = contentExport.text
      ? [{ name: "approved-content.txt", content: contentExport.text }]
      : [];

    try {
      await downloadAllAsZip(assets, zipName || "creative-assets.zip", extraFiles);
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

      {/* A note about the AI text. Shown only if the AI wrote something. */}
      {contentExport.generatedCount > 0 && (
        <div className="mb-3 rounded-xl bg-stone-50 px-4 py-3 text-[13px] text-stone-600">
          {contentExport.approvedCount > 0 ? (
            <p>
              Download All also includes <span className="font-semibold">approved-content.txt</span>{" "}
              with {contentExport.approvedCount} approved{" "}
              {contentExport.approvedCount === 1 ? "text" : "texts"}.
            </p>
          ) : (
            <p>No AI text is approved, so the ZIP contains only the images.</p>
          )}
          {contentExport.leftOut.length > 0 && (
            <p className="mt-1 text-amber-700">
              Not approved, so left out: {contentExport.leftOut.join(", ")}.
            </p>
          )}
        </div>
      )}

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