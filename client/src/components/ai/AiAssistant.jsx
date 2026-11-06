import { useState } from "react";
import ProductInfoForm from "./ProductInfoForm";
import AnalysisPanel from "./AnalysisPanel";
import SecondaryButton from "../SecondaryButton";
import { analyzeProduct } from "../../utils/aiApi";

// The AI section. It keeps its own state for now (we'll share the analysis
// with other features in Phase 2).
function AiAssistant({ file }) {
  const [productInfo, setProductInfo] = useState({ brand: "", name: "", notes: "" });
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      setAnalysis(await analyzeProduct(file, productInfo));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-base font-semibold">
        AI assistant <span className="text-[13px] font-normal text-stone-400">(optional)</span>
      </h2>

      <div className="rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
        <p className="mb-4 text-sm text-stone-500">
          Let AI describe what it sees in the photo. What you type below is used exactly as you
          write it and is never guessed. The photo and this text are sent to Google's Gemini API.
        </p>

        <ProductInfoForm value={productInfo} onChange={setProductInfo} disabled={isAnalyzing} />

        <SecondaryButton className="w-full py-3" onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : analysis ? "Analyze again" : "Analyze with AI"}
        </SecondaryButton>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {analysis && <AnalysisPanel analysis={analysis} />}
    </section>
  );
}

export default AiAssistant;