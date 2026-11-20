import { useState } from "react";
import ProductInfoForm from "./ProductInfoForm";
import AnalysisPanel from "./AnalysisPanel";
import DescriptionSection from "./DescriptionSection";
import AltTextSection from "./AltTextSection";
import CaptionSection from "./CaptionSection";
import SeoSection from "./SeoSection";
import NamingSection from "./NamingSection";
import SecondaryButton from "../SecondaryButton";
import { analyzeProduct } from "../../utils/aiApi";
import { EMPTY_AI, defaultNaming } from "../../utils/aiState";

// The AI section. It no longer owns the AI data: App does (the "ai" object).
// This component shows it and asks App to change it.
//   ai        = everything the AI produced (see utils/aiState.js)
//   setAi     = changes it
//   platforms = the platform ids selected in the main platform picker
function AiAssistant({ file, ai, setAi, platforms }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Makes a setter for ONE part of the ai object, for example setPart("altText").
  // Like useState's setter, it accepts a new value or a function.
  const setPart = (key) => (update) =>
    setAi((current) => ({
      ...current,
      [key]: typeof update === "function" ? update(current[key]) : update,
    }));

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError("");
    // Everything below the analysis belongs to the old analysis, so clear it.
    // What you typed in Product info stays.
    setAi((current) => ({ ...EMPTY_AI, productInfo: current.productInfo }));

    try {
      const analysis = await analyzeProduct(file, ai.productInfo);
      setAi((current) => ({
        ...current,
        analysis,
        naming: defaultNaming(analysis, current.productInfo),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const { analysis, productInfo } = ai;

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

        <ProductInfoForm
          value={productInfo}
          onChange={setPart("productInfo")}
          disabled={isAnalyzing}
        />

        <SecondaryButton className="w-full py-3" onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "Analyzing..." : analysis ? "Analyze again" : "Analyze with AI"}
        </SecondaryButton>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {analysis && (
        <>
          <AnalysisPanel analysis={analysis} />
          <DescriptionSection
            analysis={analysis}
            productInfo={productInfo}
            items={ai.description}
            setItems={setPart("description")}
          />
          <AltTextSection analysis={analysis} item={ai.altText} setItem={setPart("altText")} />
          <CaptionSection
            analysis={analysis}
            productInfo={productInfo}
            items={ai.captions}
            setItems={setPart("captions")}
          />
          <SeoSection
            analysis={analysis}
            productInfo={productInfo}
            items={ai.seo}
            setItems={setPart("seo")}
          />
          <NamingSection
            brand={productInfo.brand}
            naming={ai.naming}
            onNamingChange={setPart("naming")}
            platforms={platforms}
          />
        </>
      )}
    </section>
  );
}

export default AiAssistant;