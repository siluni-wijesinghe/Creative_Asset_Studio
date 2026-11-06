// Claims that need a real source. If the text says one of these and the
// facts don't, we warn the user.
const RISKY_CLAIMS = [
  "waterproof",
  "water-resistant",
  "dishwasher",
  "microwave",
  "organic",
  "vegan",
  "handmade",
  "bpa",
  "hypoallergenic",
  "warranty",
  "certified",
  "patented",
  "free shipping",
  "limited edition",
  "discount",
  "% off",
];

const PRICE_PATTERN = /[$€£₹]|\b(?:usd|eur|gbp|lkr)\b/i;

// Compares a generated text with the facts it was allowed to use.
// Returns a list of plain-language warnings (empty if nothing looks off).
export function findUnsupportedFacts(text, sourceText) {
  const warnings = [];
  const source = sourceText.toLowerCase();
  const lower = text.toLowerCase();

  // Numbers that never appeared in the facts (sizes, quantities, years...)
  const numbers = [...new Set(text.match(/\d+(?:[.,]\d+)?/g) || [])];
  const unsupported = numbers.filter((n) => !source.includes(n));
  if (unsupported.length > 0) {
    warnings.push(`Contains numbers that aren't in your product info: ${unsupported.join(", ")}`);
  }

  // A price when none was given
  if (PRICE_PATTERN.test(text) && !PRICE_PATTERN.test(sourceText)) {
    warnings.push("Mentions a price that isn't in your product info.");
  }

  // Risky claims that nobody provided
  const claims = RISKY_CLAIMS.filter((claim) => lower.includes(claim) && !source.includes(claim));
  if (claims.length > 0) {
    warnings.push(`Makes claims that aren't in your product info: ${claims.join(", ")}`);
  }

  return warnings;
}