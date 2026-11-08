import { useEffect, useState } from "react";
import SecondaryButton from "../SecondaryButton";
import { previewNames } from "../../utils/aiApi";

// These ids match the asset types the server accepts
const ASSET_TYPES = [
  { id: "product", label: "Product" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "detail", label: "Detail" },
  { id: "branded", label: "Branded (with logo)" },
];

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-stone-400 focus:border-stone-900";

// Shows the final file names. The names are built on the server by plain code
// (no AI). The brand comes only from what you typed in "Product info".
function NamingSection({ analysis, productInfo }) {
  // Start from your own product name, or else the AI's name for the product
  const [product, setProduct] = useState(
    productInfo.name || (analysis.productName.toLowerCase() === "unknown" ? "" : analysis.productName)
  );
  const [assetType, setAssetType] = useState("product");
  const [version, setVersion] = useState(1);
  const [names, setNames] = useState([]);
  const [error, setError] = useState("");

  // Asks the server for the names whenever something changes.
  // The short delay (300 ms) avoids a request on every single keystroke.
  useEffect(() => {
    let cancelled = false; // ignore answers that arrive after we've moved on

    const timer = setTimeout(async () => {
      try {
        const result = await previewNames({ brand: productInfo.brand, product, assetType, version });
        if (!cancelled) {
          setNames(result);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }, 300);

    // This cleanup runs before the next effect: it cancels the waiting request
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [productInfo.brand, product, assetType, version]);

  return (
    <div className="mt-6 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold">File naming</h3>
      <p className="mb-3 text-[13px] text-stone-500">
        Pattern: brand-product-platform-asset type-version. The names are built by the app, not by
        the AI.
      </p>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[13px] text-stone-500">Product name for the files</span>
          <input
            className={inputClass}
            value={product}
            maxLength={100}
            placeholder="e.g. Blue coffee mug"
            onChange={(e) => setProduct(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] text-stone-500">Asset type</span>
          <select
            className={inputClass}
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
          >
            {ASSET_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-1 block text-[13px] text-stone-500">Version</span>
          <div className="flex items-center gap-2">
            <SecondaryButton
              className="px-3 py-2"
              onClick={() => setVersion((v) => Math.max(v - 1, 1))}
              disabled={version <= 1}
            >
              −
            </SecondaryButton>
            <span className="min-w-10 text-center text-sm font-semibold">v{version}</span>
            <SecondaryButton
              className="px-3 py-2"
              onClick={() => setVersion((v) => Math.min(v + 1, 99))}
              disabled={version >= 99}
            >
              +
            </SecondaryButton>
          </div>
        </div>
      </div>

      <p className="mb-3 text-[13px] text-stone-500">
        Brand:{" "}
        {productInfo.brand ? (
          <span className="font-semibold text-stone-900">{productInfo.brand}</span>
        ) : (
          "none (it is left out of the names). Type one in Product info above."
        )}
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {names.length > 0 && (
        <ul className="space-y-1.5 rounded-xl bg-stone-50 p-3">
          {names.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-[13px] text-stone-500">{item.platform}</span>
              <span className="break-all font-mono text-xs text-stone-900">{item.filename}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-stone-400">
        These names aren't used for exports yet. That comes in the next phase.
      </p>
    </div>
  );
}

export default NamingSection;